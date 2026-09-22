import { unlink } from 'node:fs/promises'

import { CriarEvidenciaUseCase } from '@/domain/evidencia/CriarEvidenciaUseCase'
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

interface Dependencies {
  criarEvidenciaUseCase: CriarEvidenciaUseCase
}

interface Body {
  nome?: unknown
  capturado_em?: unknown
}

interface UploadedFile {
  filename: string
  mimetype: string
  size: number
  path: string
}

export class CriarEvidenciaController implements RequestHandler {
  private readonly criarEvidenciaUseCase: CriarEvidenciaUseCase

  constructor(dependencies: Dependencies) {
    this.criarEvidenciaUseCase = dependencies.criarEvidenciaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId, file: rawFile } = request.params as { eventoId?: string; file?: unknown }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const file = rawFile as UploadedFile | undefined
    if (!file) return new BadRequestError({ message: 'Arquivo (campo "arquivo") é obrigatório' })

    const body = (request.body ?? {}) as Body

    const nome = parseString(body.nome, 'nome')
    if (nome instanceof Error) return await cleanupAndReturn(file.path, nome)

    const capturadoEm = parseDate(body.capturado_em, 'capturado_em')
    if (capturadoEm instanceof Error) return await cleanupAndReturn(file.path, capturadoEm)

    // Substituir por request.usuario.id assim que a
    // autenticação for integrada.
    const usuarioId = null

    const result = await this.criarEvidenciaUseCase.execute({
      evento_id: eventoId,
      nome,
      arquivo: file.filename,
      mime_type: file.mimetype,
      tamanho: file.size,
      capturado_em: capturadoEm,
      created_by: usuarioId
    })

    if (result.left()) {
      await unlink(file.path).catch(() => {})

      const error = result.value
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    return {
      body: { ...result.value, url: `/uploads/evidencias/${result.value.arquivo}` },
      statusCode: StatusCode.Created
    }
  }
}

async function cleanupAndReturn(filePath: string, error: Error): Promise<HttpError> {
  await unlink(filePath).catch(() => {})
  return new BadRequestError({ message: error.message })
}

function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  return Number(raw)
}

function parseString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string' || !raw.trim()) {
    return new Error(`${field} é obrigatório`)
  }
  return raw
}

function parseDate(raw: unknown, field: string): Date | Error {
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido. Use uma data no formato ISO 8601`)
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return new Error(`${field} inválido. Use uma data no formato ISO 8601`)
  }
  return date
}
