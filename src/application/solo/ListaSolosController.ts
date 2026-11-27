import { ListaSolosUseCase } from '@/domain/solo/ListaSolosUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaSolosUseCase: ListaSolosUseCase
}

/**
 * Controller responsável por listar solos aplicando filtros e ordenação opcionais.
 */
export class ListaSolosController implements RequestHandler {
  private readonly listaSolosUseCase: ListaSolosUseCase

  constructor(dependencies: Dependencies) {
    this.listaSolosUseCase = dependencies.listaSolosUseCase
  }

  /**
   * Trata a requisição GET /v1/solos recebendo filtros via query params.
   *
   * @param request Requisição HTTP com possíveis parâmetros de busca e ordenação.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com a lista de solos, 400 se parâmetro order for inválido ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome, order } = request.params as {
      nome?: string
      order?: string
    }

    const parsedOrder = parseOrder(order)
    if (parsedOrder instanceof Error) {
      return new BadRequestError({ message: parsedOrder.message })
    }

    const result = await this.listaSolosUseCase.execute({
      nome,
      order: parsedOrder
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}

/**
 * Converte a string de ordenação recebida no formato coluna:direcao em um objeto tipado.
 *
 * @param order String no formato "coluna:direcao" (ex: "nome:asc").
 * @returns Objeto com coluna e direção, undefined se não fornecido, ou Error se inválido.
 */
function parseOrder(order?: string): { column: 'id' | 'nome'; direction: 'asc' | 'desc' } | Error | undefined {
  if (!order) return undefined

  const pieces = order.split(':')
  if (pieces.length !== 2) {
    return new Error('order inválido. Use o formato "id:asc", "id:desc", "nome:asc" ou "nome:desc"')
  }

  const [rawColumn, rawDirection] = pieces
  const column = rawColumn.trim().toLowerCase()
  const direction = rawDirection.trim().toLowerCase()

  if ((column !== 'id' && column !== 'nome') || (direction !== 'asc' && direction !== 'desc')) {
    return new Error('order inválido. Use o formato "id:asc", "id:desc", "nome:asc" ou "nome:desc"')
  }

  return {
    column,
    direction
  }
}
