import { unlink } from 'node:fs/promises'

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
}

interface UploadedFile {
  filename: string
  mimetype: string
  size: number
  path: string
}

export class CriaLembreteEvidenciaController implements RequestHandler {
  private readonly criaLembreteEvidenciaUseCase: CriaLembreteEvidenciaUseCase

  constructor(dependencies: Dependencies) {
    this.criaLembreteEvidenciaUseCase = dependencies.criaLembreteEvidenciaUseCase
  }

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

    const result = await this.criaLembreteEvidenciaUseCase.execute({
      lembrete_id: lembreteId,
      nome,
      arquivo: file.filename,
      mime_type: file.mimetype,
      tamanho: file.size,
      data_captura: dataCaptura,
      created_by: request.user?.id ?? null
    })

    if (result.left()) {
      await cleanupFileWithLog(file.path, 'persistência de evidência de lembrete')

      const error = result.value
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
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
