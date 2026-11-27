import { ListaVegetacoesUseCase } from '@/domain/vegetacao/ListaVegetacoesUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaVegetacoesUseCase: ListaVegetacoesUseCase
}

/**
 * Controller responsável pela listagem de vegetações com filtros opcionais.
 */
export class ListaVegetacoesController implements RequestHandler {
  private readonly listaVegetacoesUseCase: ListaVegetacoesUseCase

  constructor(dependencies: Dependencies) {
    this.listaVegetacoesUseCase = dependencies.listaVegetacoesUseCase
  }

  /**
   * Trata a requisição GET /v1/vegetacoes.
   *
   * @param request Requisição HTTP com parâmetros opcionais (nome, order).
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com lista de vegetações, 400 se order inválido ou 500.
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

    const result = await this.listaVegetacoesUseCase.execute({
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
 * Faz o parsing da string de ordenação recebida no formato coluna:direcao.
 *
 * @param order String no formato "coluna:direcao" (ex: "nome:asc").
 * @returns Objeto com coluna e direção, undefined se omitido, ou Error se inválido.
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
