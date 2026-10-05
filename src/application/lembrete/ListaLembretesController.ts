import { isDataValida } from '@/domain/lembrete/Lembrete'
import { LembreteFilters, LembreteOrder } from '@/domain/lembrete/LembreteCollection'
import { ListaLembretesUseCase } from '@/domain/lembrete/ListaLembretesUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaLembretesUseCase: ListaLembretesUseCase
}

const COLUNAS_ORDENAVEIS: ReadonlyArray<LembreteOrder['column']> = ['id', 'data_coleta']
const DIRECOES: ReadonlyArray<LembreteOrder['direction']> = ['asc', 'desc']

export class ListaLembretesController implements RequestHandler {
  private readonly listaLembretesUseCase: ListaLembretesUseCase

  constructor(dependencies: Dependencies) {
    this.listaLembretesUseCase = dependencies.listaLembretesUseCase
  }

  // Próximos lembretes (a partir de hoje, o mais próximo primeiro):
  // GET /api/v2/lembretes?data_coleta_de=2026-10-05

  // Lembretes de um intervalo:
  // GET /api/v2/lembretes?data_coleta_de=2026-11-01&data_coleta_ate=2026-11-30

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      data_coleta_de,
      data_coleta_ate,
      order,
      limite,
      pagina
    } = request.params as Record<string, string | undefined>

    const filters: LembreteFilters = {}

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

    const result = await this.listaLembretesUseCase.execute(filters)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { body: result.value, statusCode: StatusCode.Ok }
  }
}
