import { AtualizarEventoUseCase, Input as AtualizarEventoInput } from '@/domain/evento/AtualizarEventoUseCase'
import {
  ColetaAttributes, EVENTO_TIPOS, EventoTipo
} from '@/domain/evento/Evento'
import { CheckViolationError } from '@/infrastructure/error/CheckViolationError'
import { ForeignKeyViolationError } from '@/infrastructure/error/ForeignKeyViolationError'
import { InfrastructureError } from '@/infrastructure/error/InfrastructureError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { UnprocessableEntityError } from '@/library/http/error/UnprocessableEntityError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  atualizarEventoUseCase: AtualizarEventoUseCase
}

interface Body {
  tipo?: unknown
  capturado_em?: unknown
  latitude?: unknown
  longitude?: unknown
  altitude?: unknown
  observacoes?: unknown
  coleta?: unknown
}

export class AtualizarEventoController implements RequestHandler {
  private readonly atualizarEventoUseCase: AtualizarEventoUseCase

  constructor(dependencies: Dependencies) {
    this.atualizarEventoUseCase = dependencies.atualizarEventoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const body = (request.body ?? {}) as Body

    // Substituir por request.usuario.id assim que a 
    // autenticação for integrada.
    const input: AtualizarEventoInput = { id: eventoId, updated_by: null }

    if (body.tipo !== undefined) {
      const tipo = parseTipo(body.tipo)
      if (tipo instanceof Error) return new BadRequestError({ message: tipo.message })
      input.tipo = tipo
    }

    if (body.capturado_em !== undefined) {
      const capturadoEm = parseDate(body.capturado_em, 'capturado_em')
      if (capturadoEm instanceof Error) return new BadRequestError({ message: capturadoEm.message })
      input.capturado_em = capturadoEm
    }

    if (body.latitude !== undefined) {
      const latitude = parseOptionalNumber(body.latitude, 'latitude')
      if (latitude instanceof Error) return new BadRequestError({ message: latitude.message })
      input.latitude = latitude
    }

    if (body.longitude !== undefined) {
      const longitude = parseOptionalNumber(body.longitude, 'longitude')
      if (longitude instanceof Error) return new BadRequestError({ message: longitude.message })
      input.longitude = longitude
    }

    if (body.altitude !== undefined) {
      const altitude = parseOptionalNumber(body.altitude, 'altitude')
      if (altitude instanceof Error) return new BadRequestError({ message: altitude.message })
      input.altitude = altitude
    }

    if (body.observacoes !== undefined) {
      const observacoes = parseOptionalString(body.observacoes, 'observacoes')
      if (observacoes instanceof Error) return new BadRequestError({ message: observacoes.message })
      input.observacoes = observacoes
    }

    if (body.coleta !== undefined) {
      const coleta = body.coleta === null ? null : parseColeta(body.coleta)
      if (coleta instanceof Error) return new BadRequestError({ message: coleta.message })
      input.coleta = coleta
    }

    const result = await this.atualizarEventoUseCase.execute(input)

    if (result.left()) {
      const error = result.value
      if (error instanceof ForeignKeyViolationError) return new NotFoundError({ message: error.message })
      if (error instanceof CheckViolationError) return new UnprocessableEntityError({ message: error.message })
      if (!(error instanceof InfrastructureError)) return new BadRequestError({ message: error.message })
      return new InternalServerError({ message: error.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Evento não encontrado' })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}

const CAMPOS_DA_FICHA = [
  'familia',
  'nome_popular',
  'nome_cientifico',
  'municipio',
  'estado',
  'referencia_local',
  'tipo_vegetacao',
  'solo',
  'relevo',
  'substrato',
  'tronco_com_casca',
  'associacoes',
  'folhas',
  'habito',
  'frutos',
  'flores',
  'luminosidade'
] as const satisfies ReadonlyArray<keyof ColetaAttributes>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  return Number(raw)
}

function parseTipo(raw: unknown): EventoTipo | Error {
  if (typeof raw !== 'string' || !EVENTO_TIPOS.includes(raw as EventoTipo)) {
    return new Error(`tipo inválido. Use um de: ${EVENTO_TIPOS.join(', ')}`)
  }
  return raw as EventoTipo
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

function parseOptionalNumber(raw: unknown, field: string): number | null | Error {
  if (raw === undefined || raw === null) {
    return null
  }
  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    return new Error(`${field} inválido`)
  }
  return raw
}

function parseOptionalString(raw: unknown, field: string): string | null | Error {
  if (raw === undefined || raw === null) {
    return null
  }
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido`)
  }
  return raw
}

function parseColeta(raw: unknown): ColetaAttributes | Error {
  if (!isPlainObject(raw)) {
    return new Error('coleta inválido. Envie um objeto com os campos da ficha')
  }

  const result = {} as Record<string, string | null>
  for (const campo of CAMPOS_DA_FICHA) {
    const value = raw[campo]
    if (value === undefined) {
      result[campo] = null
      continue
    }
    if (value !== null && typeof value !== 'string') {
      return new Error(`coleta.${campo} inválido`)
    }
    result[campo] = value
  }
  return result as unknown as ColetaAttributes
}
