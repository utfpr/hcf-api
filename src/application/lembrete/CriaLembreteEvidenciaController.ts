import { unlink } from 'node:fs/promises'

import { parseClientUuid } from '@/application/parseClientUuid'
import { CriaLembreteEvidenciaUseCase } from '@/domain/lembrete/CriaLembreteEvidenciaUseCase'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
import { InfrastructureError } from '@/infrastructure/error/InfrastructureError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import {
  lembreteEvidenciaUrl, parseDate, parseId, parseNonEmptyString
} from './lembrete-parsing'

interface Dependencies {
  criaLembreteEvidenciaUseCase: CriaLembreteEvidenciaUseCase
}

interface Body {
  nome?: unknown
  data_captura?: unknown
  client_uuid?: unknown
}

interface UploadedFile {
  filename: string
  mimetype: string
  size: number
  path: string
}

/**
 * Controller responsável pelo endpoint de upload e associação de fotos a lembretes (POST /api/v1/lembretes/:lembreteId/evidencias).
 * Trata descarte de arquivos órfãos em disco em caso de erros de validação ou retentativas com `client_uuid`.
 */
export class CriaLembreteEvidenciaController implements RequestHandler {
  private readonly criaLembreteEvidenciaUseCase: CriaLembreteEvidenciaUseCase

  /**
   * @param dependencies Instância do caso de uso de criação de evidência de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.criaLembreteEvidenciaUseCase = dependencies.criaLembreteEvidenciaUseCase
  }

  /**
   * Processa o upload da imagem e associa à evidência do lembrete.
   *
   * @param request Requisição HTTP contendo ':lembreteId', arquivo no Multer e metadados.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 201 Created com a evidência e URL pública ou 400/404/500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { lembreteId: rawLembreteId, file: rawFile } = request.params as { lembreteId?: string; file?: unknown }
    const file = rawFile as UploadedFile | undefined

    const lembreteId = parseId(rawLembreteId, 'lembreteId')
    if (lembreteId instanceof Error) return await cleanupAndReturn(file?.path, lembreteId)

    if (!file) return new BadRequestError({ message: 'Arquivo (campo "arquivo") é obrigatório' })

    const body = (request.body ?? {}) as Body

    const nome = parseNonEmptyString(body.nome, 'nome')
    if (nome instanceof Error) return await cleanupAndReturn(file.path, nome)

    const dataCaptura = parseDate(body.data_captura, 'data_captura')
    if (dataCaptura instanceof Error) return await cleanupAndReturn(file.path, dataCaptura)

    // Trata idempotência com client_uuid para evitar arquivos duplicados em reconexões do app móvel
    const clientUuid = parseClientUuid(body.client_uuid)
    if (clientUuid instanceof Error) return await cleanupAndReturn(file.path, clientUuid)

    const result = await this.criaLembreteEvidenciaUseCase.execute({
      lembrete_id: lembreteId,
      nome,
      arquivo: file.filename,
      mime_type: file.mimetype,
      tamanho: file.size,
      data_captura: dataCaptura,
      created_by: request.user?.id ?? null,
      ...(clientUuid ? { client_uuid: clientUuid } : {})
    })

    if (result.left()) {
      // Remove o arquivo físico salvo pelo Multer caso a validação da entidade ou gravação no banco falhe
      await cleanupFileWithLog(file.path, 'persistência de evidência de lembrete')

      const error = result.value
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    // Reenvio offline idempotente (mesmo client_uuid): se a evidência já possuía arquivo gravado, descarta o arquivo excedente recém-enviado
    if (result.value.arquivo !== file.filename) {
      await unlink(file.path).catch(() => {})
    }

    return {
      body: { ...result.value, url: lembreteEvidenciaUrl(result.value.arquivo) },
      statusCode: StatusCode.Created
    }
  }
}

async function cleanupAndReturn(filePath: string | undefined, error: Error): Promise<HttpError> {
  if (filePath) await cleanupFileWithLog(filePath, 'validação de requisição de evidência de lembrete')
  return new BadRequestError({ message: error.message })
}

async function cleanupFileWithLog(filePath: string, context: string): Promise<void> {
  await unlink(filePath).catch((unlinkError: unknown) => {
    // eslint-disable-next-line no-console -- sem log, falhas de limpeza de arquivo ficam silenciosas e deixam órfãos sem rastreabilidade
    console.error(`Falha ao remover arquivo de evidência após erro de ${context} (path=${filePath})`, unlinkError)
  })
}
