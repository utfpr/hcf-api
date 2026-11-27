import { ExpedicaoCollection, ExpedicaoFilters } from '@/domain/expedicao/ExpedicaoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

/**
 * Formato tipado para requisições com parâmetros de consulta da listagem de expedições.
 */
export interface CustomHttpRequest extends HttpRequest {
  params: Record<string, string | undefined>
}

/**
 * Controller responsável pela listagem paginada e filtrada de expedições (GET /api/v1/expedicoes).
 * Permite filtros por cidade, participante, períodos de início/fim e ordenação segura.
 */
export class ListaExpedicoesController implements RequestHandler {
  private readonly expedicaoCollection: ExpedicaoCollection

  /**
   * @param dependencies Repositório de expedições.
   */
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  /**
   * Executa a busca paginada de expedições conforme filtros e parâmetros de ordenação recebidos.
   *
   * @param request Requisição HTTP com query params de filtragem e paginação.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com coleção paginada ou erro 400/500.
   */
  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const {
        cidade_id,
        usuario_id,
        data_inicio_de,
        data_inicio_ate,
        data_fim_de,
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
      if (data_inicio_ate) filters.data_inicio_ate = data_inicio_ate
      if (data_fim_de) filters.data_fim_de = data_fim_de
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

      const result = await this.expedicaoCollection.findAll(filters)

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
