import { CadastraVegetacaoUseCase } from '@/domain/vegetacao/CadastraVegetacaoUseCase'
import { VegetacaoJaExisteError } from '@/domain/vegetacao/error/VegetacaoJaExisteError'
import { Vegetacao } from '@/domain/vegetacao/Vegetacao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraVegetacaoUseCase: CadastraVegetacaoUseCase
}

/**
 * Controller responsável pelo cadastro de novos tipos de vegetação.
 */
export class CadastraVegetacaoController implements RequestHandler {
  private readonly cadastraVegetacaoUseCase: CadastraVegetacaoUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraVegetacaoUseCase = dependencies.cadastraVegetacaoUseCase
  }

  /**
   * Trata a requisição POST /v1/vegetacoes para registrar um novo tipo de vegetação.
   *
   * @param request Requisição HTTP contendo o nome no corpo.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 201 com o recurso criado, 400 se nome for vazio, 409 se duplicado ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da vegetação não pode ser vazio' })
    }

    const result = await this.cadastraVegetacaoUseCase.execute({ nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof VegetacaoJaExisteError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: 'Erro ao criar vegetação' })
    }

    const body = vegetacaoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao criar vegetação' })
    }

    return { statusCode: StatusCode.Created, body }
  }
}

/**
 * Normaliza a entidade Vegetacao em formato id e nome para o payload HTTP.
 *
 * @param vegetacao Instância da entidade Vegetacao.
 * @returns Objeto com id e nome ou undefined se id não existir.
 */
function vegetacaoBody(vegetacao: Vegetacao): { id: string; nome: string } | undefined {
  if (vegetacao.id === undefined) {
    return undefined
  }

  return { id: vegetacao.id, nome: vegetacao.nome }
}
