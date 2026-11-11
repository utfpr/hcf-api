import { ListaLocaisDeColetaUseCase } from '@/domain/localColeta/ListaLocaisDeColetaUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaLocaisDeColetaUseCase: ListaLocaisDeColetaUseCase
}

export class ListaLocaisDeColetaController implements RequestHandler {
  private readonly listaLocaisDeColetaUseCase: ListaLocaisDeColetaUseCase

  constructor(dependencies: Dependencies) {
    this.listaLocaisDeColetaUseCase = dependencies.listaLocaisDeColetaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const params = request.params as {
      cidade_id?: string
      estado_id?: string
      pais_id?: string
      descricao?: string
      order?: string
      limite?: string
      pagina?: string
      getAll?: string
    }
    const getAll = params.getAll === 'true'
    const order = parseOrder(params.order)
    const limite = parsePositiveInteger(params.limite, 20)
    if (order instanceof Error) {
      return new BadRequestError({ message: order.message })
    }

    const pagina = parsePositiveInteger(params.pagina, 1)
    const invalidLocationFilter = [
      params.cidade_id,
      params.estado_id,
      params.pais_id
    ]
      .some(value => value !== undefined && !isPositiveInteger(value))

    if (invalidLocationFilter) {
      return new BadRequestError({ message: 'cidade_id, estado_id e pais_id devem ser inteiros positivos' })
    }

    if (!getAll && (limite instanceof Error || pagina instanceof Error)) {
      return new BadRequestError({ message: 'limite e pagina devem ser inteiros positivos' })
    }

    try {
      const result = await this.listaLocaisDeColetaUseCase.execute({
        cidade_id: params.cidade_id,
        estado_id: params.estado_id,
        pais_id: params.pais_id,
        descricao: params.descricao,
        order,
        limite: limite instanceof Error ? 20 : limite,
        pagina: pagina instanceof Error ? 1 : pagina,
        getAll
      })

      if (result.left()) {
        return new InternalServerError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.Ok,
        body: getAll
          ? { resultado: result.value.resultado }
          : {
              metadados: {
                total: result.value.total,
                pagina,
                limite
              },
              resultado: result.value.resultado
            }
      }
    } catch (error) {
      return new InternalServerError({
        message: error instanceof Error ? error.message : 'Erro ao listar locais de coleta'
      })
    }
  }
}

function parsePositiveInteger(value: string | undefined, defaultValue: number): number | Error {
  if (value === undefined) return defaultValue
  const parsedValue = Number(value)
  if (!isPositiveInteger(value)) return new Error('invalid integer')
  return parsedValue
}

function isPositiveInteger(value: string): boolean {
  const parsedValue = Number(value)
  return /^\d+$/.test(value) && Number.isSafeInteger(parsedValue) && parsedValue > 0
}

function parseOrder(order?: string): { column: 'id' | 'descricao'; direction: 'asc' | 'desc' } | Error | undefined {
  if (!order) return undefined

  const pieces = order.split(':')
  if (pieces.length !== 2) {
    return new Error('order inválido. Use "id:asc", "id:desc", "descricao:asc" ou "descricao:desc"')
  }

  const [rawColumn, rawDirection] = pieces
  const column = rawColumn.trim().toLowerCase()
  const direction = rawDirection.trim().toLowerCase()

  if ((column !== 'id' && column !== 'descricao') || (direction !== 'asc' && direction !== 'desc')) {
    return new Error('order inválido. Use "id:asc", "id:desc", "descricao:asc" ou "descricao:desc"')
  }

  return { column, direction }
}
