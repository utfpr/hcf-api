import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdcionaParticipanteUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  adicionaParticipanteUseCase: AdicionaParticipanteUseCase
}

interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
  body: unknown
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class AdicionaParticipanteController implements RequestHandler {
  private readonly adicionaParticipanteUseCase: AdicionaParticipanteUseCase

  constructor(dependencies: Dependencies) {
    this.adicionaParticipanteUseCase = dependencies.adicionaParticipanteUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      // TODO: AUTENTICAÇÃO TEMPORARIAMENTE DESABILITADA

      const { expedicaoId } = request.params
      const { usuarioId } = request.body as { usuarioId?: number }
      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (usuarioId === undefined || typeof usuarioId !== 'number' || usuarioId <= 0) {
        return new BadRequestError({ message: 'usuarioId inválido' })
      }

      const result = await this.adicionaParticipanteUseCase.execute(Number(expedicaoId), usuarioId)
      if (result.left()) {
        if (result.value.message.includes('já está nesta expedição')) {
          return new ConflictError({ message: result.value.message })
        }

        if (result.value.name === 'CollectionError' || result.value.message.includes('Falha ao adicionar')) {
          return new InternalServerError({ message: 'Falha interna ao adicionar participante' })
        }

        return new BadRequestError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.Created,
        body: { message: 'Participante adicionado com sucesso.' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao adicionar participante'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
