import { ExpedicaoFilters } from '@/domain/expedicao/ExpedicaoCollection'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaExpedicoesUseCase: ListaExpedicoesUseCase
}

// interface do formato da nossa query
interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
}

export class ListaExpedicoesController implements RequestHandler {
  private readonly listaExpedicoesUseCase: ListaExpedicoesUseCase

  constructor(dependencies: Dependencies) {
    this.listaExpedicoesUseCase = dependencies.listaExpedicoesUseCase
  }

  // Listar todas (com ordenação padrão DESC):
  // GET /api/v2/expedicoes

  // Filtrar por uma cidade específica:
  // GET /api/v2/expedicoes?cidade_id=1100049

  // Filtrar por intervalo de datas:
  // GET /api/v2/expedicoes?data_inicio_de=2026-01-01&data_fim_ate=2026-12-31

  // Filtrar com ordenação segura:
  // GET /api/v2/expedicoes?order=data_inicio:desc

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const {
        cidade_id,
        usuario_id,
        data_inicio_de,
        data_fim_ate,
        order,
        limite,
        pagina
      } = request.params

      const filters: ExpedicaoFilters = {}

      if (cidade_id && !Number.isNaN(Number(cidade_id))) {
        filters.cidade_id = Number(cidade_id)
      }

      if (usuario_id && !Number.isNaN(Number(usuario_id))) {
        filters.usuario_id = Number(usuario_id)
      }

      if (data_inicio_de) filters.data_inicio_de = data_inicio_de
      if (data_fim_ate) filters.data_fim_ate = data_fim_ate

      // Validação da ordenação
      if (order) {
        const [column, direction] = order.split(':')
        const colunasValidas = [
          'id',
          'data_inicio',
          'data_fim'
        ]
        const direcoesValidas = ['asc', 'desc']

        if (!colunasValidas.includes(column) || !direcoesValidas.includes(direction)) {
          return new BadRequestError({
            message: 'order inválido. Use o formato "id:asc", "id:desc", "data_inicio:asc" ou "data_fim:desc"'
          })
        }

        filters.order = {
          column: column as 'id' | 'data_inicio' | 'data_fim',
          direction: direction as 'asc' | 'desc'
        }
      }

      if (limite && !Number.isNaN(Number(limite))) {
        filters.limite = Number(limite)
      }
      if (pagina && !Number.isNaN(Number(pagina))) {
        filters.pagina = Number(pagina)
      }

      const result = await this.listaExpedicoesUseCase.execute(filters)

      // erro de infra
      if (result.left()) {
        return new InternalServerError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.Ok,
        body: result.value
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao listar expedições'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
