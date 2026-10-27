import { isDataValida } from '@/domain/lembrete/Lembrete'
import {
  LembreteCollection, LembreteFilters, LembreteOrder
} from '@/domain/lembrete/LembreteCollection'
import { LembreteEvidenciaCollection } from '@/domain/lembrete/LembreteEvidenciaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

import { lembreteEvidenciaUrl, parseExpedicaoId } from './lembrete-parsing'

interface Dependencies {
  lembreteCollection: LembreteCollection
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

const COLUNAS_ORDENAVEIS: ReadonlyArray<LembreteOrder['column']> = ['id', 'data_coleta']
const DIRECOES: ReadonlyArray<LembreteOrder['direction']> = ['asc', 'desc']

export class ListaLembretesController implements RequestHandler {
  private readonly lembreteCollection: LembreteCollection
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  // Próximos lembretes (a partir de hoje, o mais próximo primeiro):
  // GET /api/v1/lembretes?data_coleta_de=2026-10-05

  // Lembretes de um intervalo:
  // GET /api/v1/lembretes?data_coleta_de=2026-11-01&data_coleta_ate=2026-11-30

  // Lembretes criados numa expedição:
  // GET /api/v1/lembretes?expedicao_id=3

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      expedicao_id,
      data_coleta_de,
      data_coleta_ate,
      order,
      limite,
      pagina
    } = request.params as Record<string, string | undefined>

    const filters: LembreteFilters = {}

    if (expedicao_id !== undefined) {
      const expedicaoId = parseExpedicaoId(expedicao_id)
      if (expedicaoId instanceof Error) return new BadRequestError({ message: expedicaoId.message })
      if (expedicaoId !== null) filters.expedicao_id = expedicaoId
    }

    if (data_coleta_de) {
      if (!isDataValida(data_coleta_de)) {
        return new BadRequestError({ message: 'data_coleta_de inválido. Use o formato YYYY-MM-DD' })
      }
      filters.data_coleta_de = data_coleta_de
    }

    if (data_coleta_ate) {
      if (!isDataValida(data_coleta_ate)) {
        return new BadRequestError({ message: 'data_coleta_ate inválido. Use o formato YYYY-MM-DD' })
      }
      filters.data_coleta_ate = data_coleta_ate
    }

    if (order) {
      const [column, direction] = order.split(':') as [LembreteOrder['column'], LembreteOrder['direction']]
      if (!COLUNAS_ORDENAVEIS.includes(column) || !DIRECOES.includes(direction)) {
        return new BadRequestError({
          message: 'order inválido. Use o formato "data_coleta:asc", "data_coleta:desc", "id:asc" ou "id:desc"'
        })
      }
      filters.order = { column, direction }
    }

    if (limite && !Number.isNaN(Number(limite))) {
      filters.limite = Number(limite)
    }

    if (pagina && !Number.isNaN(Number(pagina))) {
      filters.pagina = Number(pagina)
    }

    const result = await this.lembreteCollection.findAll(filters)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    // As fotos vêm junto para o app montar o card sem uma chamada por lembrete
    const ids = result.value.itens.map(lembrete => lembrete.id)
    if (ids.length === 0) {
      return { body: { ...result.value, itens: [] }, statusCode: StatusCode.Ok }
    }
    const evidenciasResult = await this.lembreteEvidenciaCollection.findAll({ lembrete_ids: ids })
    if (evidenciasResult.left()) return new InternalServerError({ message: evidenciasResult.value.message })
    const evidencias = evidenciasResult.value

    const itens = result.value.itens.map(lembrete => ({
      ...lembrete,
      evidencias: evidencias
        .filter(evidencia => evidencia.lembrete_id === lembrete.id)
        .map(evidencia => ({ ...evidencia, url: lembreteEvidenciaUrl(evidencia.arquivo) }))
    }))

    return { body: { ...result.value, itens }, statusCode: StatusCode.Ok }
  }
}
