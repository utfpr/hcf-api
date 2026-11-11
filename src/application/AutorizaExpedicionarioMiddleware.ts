import { unlink } from 'node:fs/promises'

import {
  type Action, EXPEDICIONARIO, type Resource
} from '@/library/auth/createRules'
import { type Either } from '@/library/either/Either'
import { type HttpRequest, type HttpResponse } from '@/library/http/common'
import { ForbiddenError } from '@/library/http/error/ForbiddenError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

/** Registro sobre o qual a requisição age, reduzido ao que a autorização precisa. */
export interface AlvoExpedicionario {
  expedicaoId: number | null
  /** created_by do registro que precisa ser do usuário (quando `dono` está configurado). */
  criadoPor?: number | null
  /** created_by do pai, usado quando o alvo não tem expedição e `semExpedicao` é 'dono'. */
  criadoPorPai?: number | null
}

/**
 * Devolve o alvo, `undefined` quando o registro não existe ou o id é inválido
 * (o controller responde 400/404 como sempre) ou um Error de infraestrutura.
 */
export type ResolveAlvo = (request: HttpRequest) => Promise<AlvoExpedicionario | undefined | Error>

export interface VerificaParticipacao {
  isParticipant(expedicaoId: number, usuarioId: number): Promise<Either<Error, boolean>>
}

interface Dependencies {
  participacao: VerificaParticipacao
  resolveAlvo: ResolveAlvo
  /** Quando presente, `auth.can(action, resource, { created_by: alvo.criadoPor })` precisa passar. */
  dono?: { action: Action; resource: Resource }
  /**
   * Alvo sem expedição (lembrete solto): 'livre' deixa passar, 'dono' exige que
   * o pai (`criadoPorPai`, ou `criadoPor` na falta dele) seja do usuário.
   */
  semExpedicao: 'livre' | 'dono'
}

export const MENSAGEM_NAO_PARTICIPA = 'Você não participa desta expedição'
export const MENSAGEM_NAO_E_DONO = 'Você só pode alterar registros criados por você'

/**
 * Restringe a escrita do Expedicionário às expedições de que ele participa e,
 * onde configurado, aos registros que ele mesmo criou. Para os demais tipos de
 * usuário é um no-op: as regras do authorize já bastam.
 *
 * Roda depois do authorize (precisa de request.user/auth). Em rotas de upload em
 * disco, apaga o arquivo recebido quando recusa.
 */
export class AutorizaExpedicionarioMiddleware implements RequestHandler {
  private readonly participacao: VerificaParticipacao
  private readonly resolveAlvo: ResolveAlvo
  private readonly dono?: Dependencies['dono']
  private readonly semExpedicao: Dependencies['semExpedicao']

  constructor(dependencies: Dependencies) {
    this.participacao = dependencies.participacao
    this.resolveAlvo = dependencies.resolveAlvo
    this.dono = dependencies.dono
    this.semExpedicao = dependencies.semExpedicao
  }

  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    const { user, auth } = request
    if (!user || !auth || Number(user.tipo_usuario_id) !== EXPEDICIONARIO) {
      return next()
    }

    const alvo = await this.resolveAlvo(request)
    if (alvo instanceof Error) {
      return new InternalServerError({ message: alvo.message, cause: alvo })
    }
    if (alvo === undefined) {
      return next()
    }

    if (this.dono && !auth.can(this.dono.action, this.dono.resource, { created_by: alvo.criadoPor ?? null })) {
      return recusa(request, MENSAGEM_NAO_E_DONO)
    }

    if (alvo.expedicaoId === null) {
      if (this.semExpedicao === 'dono') {
        const donoPai = alvo.criadoPorPai !== undefined ? alvo.criadoPorPai : alvo.criadoPor
        if (donoPai !== user.id) return recusa(request, MENSAGEM_NAO_E_DONO)
      }
      return next()
    }

    const participa = await this.participacao.isParticipant(alvo.expedicaoId, user.id)
    if (participa.left()) {
      return new InternalServerError({ message: participa.value.message, cause: participa.value })
    }
    if (!participa.value) {
      return recusa(request, MENSAGEM_NAO_PARTICIPA)
    }

    return next()
  }
}

async function recusa(request: HttpRequest, message: string): Promise<HttpError> {
  const file = (request.params as { file?: { path?: string } }).file
  if (file?.path) await unlink(file.path).catch(() => {})
  return new ForbiddenError({ message })
}
