import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { ExpedicaoFilters } from '@/domain/expedicao/ExpedicaoCollection'
import { HttpRequest, HttpResponse, StatusCode } from '@/library/http/common'
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
  // GET /api/v2/expedicoes?data_inicio_de=2026-01-01&data_fim_ate=2026-12-31]

  // Filtrar com ordenação:
  // GET /api/v2/expedicoes?order_column=id&order_direction=asc


  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { 
        cidade_id, 
        usuario_id, 
        data_inicio_de, 
        data_fim_ate, 
        order_column, 
        order_direction 
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

      if (order_column && order_direction) {
        filters.order = {
          column: order_column as 'id' | 'data_inicio' | 'data_fim',
          direction: order_direction as 'asc' | 'desc'
        }
      }

      const result = await this.listaExpedicoesUseCase.execute(filters)

      if (result.left()) {
        return new BadRequestError({ message: result.value.message })
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
