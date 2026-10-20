import { EventoNaoEncontradoError } from '@/domain/evento/error/EventoNaoEncontradoError'
import { CriaEvidenciaUseCase } from '@/domain/evidencia/CriaEvidenciaUseCase'
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
  criaEvidenciaUseCase: CriaEvidenciaUseCase
}

interface Body {
  nome?: unknown
  data_captura?: unknown
}

interface UploadedFile {
  mimetype: string
  buffer: Buffer
}

export class CriaEvidenciaController implements RequestHandler {
  private readonly criaEvidenciaUseCase: CriaEvidenciaUseCase

  constructor(dependencies: Dependencies) {
    this.criaEvidenciaUseCase = dependencies.criaEvidenciaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId, file: rawFile } = request.params as { eventoId?: string; file?: unknown }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const file = rawFile as UploadedFile | undefined
    if (!file) return new BadRequestError({ message: 'Arquivo (campo "arquivo") é obrigatório' })

    const body = (request.body ?? {}) as Body

    const nome = parseString(body.nome, 'nome')
    if (nome instanceof Error) return new BadRequestError({ message: nome.message })

    const dataCaptura = parseDate(body.data_captura, 'data_captura')
    if (dataCaptura instanceof Error) return new BadRequestError({ message: dataCaptura.message })

    const usuarioId = request.user?.id ?? null

    const result = await this.criaEvidenciaUseCase.execute({
      evento_id: eventoId,
      nome,
      data_captura: dataCaptura,
      mime_type: file.mimetype,
      contents: file.buffer,
      created_by: usuarioId
    })

    if (result.left()) {
      const error = result.value
      if (error instanceof EventoNaoEncontradoError || error instanceof ForeignKeyViolationError) {
        return new NotFoundError({ message: error.message })
      }
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    return {
      body: { ...result.value, url: `/uploads/evidencias/${result.value.arquivo}` },
      statusCode: StatusCode.Created
    }
  }
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
