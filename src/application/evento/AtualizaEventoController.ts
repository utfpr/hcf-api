import { AtualizaEventoUseCase, Input as AtualizaEventoInput } from '@/domain/evento/AtualizaEventoUseCase'
import { EVENTO_TIPOS, EventoTipo } from '@/domain/evento/Evento'
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

import { parseColeta } from './coleta-parsing'

interface Dependencies {
  atualizaEventoUseCase: AtualizaEventoUseCase
}

interface Body {
  tipo?: unknown
  data_captura?: unknown
  latitude?: unknown
  longitude?: unknown
  altitude?: unknown
  observacoes?: unknown
  coleta?: unknown
}

export class AtualizaEventoController implements RequestHandler {
  private readonly atualizaEventoUseCase: AtualizaEventoUseCase

  constructor(dependencies: Dependencies) {
    this.atualizaEventoUseCase = dependencies.atualizaEventoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId: rawEventoId } = request.params as { eventoId?: string }
    const eventoId = parseId(rawEventoId, 'eventoId')
    if (eventoId instanceof Error) return new BadRequestError({ message: eventoId.message })

    const body = (request.body ?? {}) as Body

    const input: AtualizaEventoInput = { id: eventoId, updated_by: request.user?.id ?? null }

    if (body.tipo !== undefined) {
      const tipo = parseTipo(body.tipo)
      if (tipo instanceof Error) return new BadRequestError({ message: tipo.message })
      input.tipo = tipo
    }

    if (body.data_captura !== undefined) {
      const dataCaptura = parseDate(body.data_captura, 'data_captura')
      if (dataCaptura instanceof Error) return new BadRequestError({ message: dataCaptura.message })
      input.data_captura = dataCaptura
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

    const result = await this.atualizaEventoUseCase.execute(input)

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
