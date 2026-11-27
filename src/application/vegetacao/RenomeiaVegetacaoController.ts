import { VegetacaoJaExisteError } from '@/domain/vegetacao/error/VegetacaoJaExisteError'
import { RenomeiaVegetacaoUseCase } from '@/domain/vegetacao/RenomeiaVegetacaoUseCase'
import { Vegetacao } from '@/domain/vegetacao/Vegetacao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  renomeiaVegetacaoUseCase: RenomeiaVegetacaoUseCase
}

/**
 * Controller responsável pela alteração de nome de um tipo de vegetação.
 */
export class RenomeiaVegetacaoController implements RequestHandler {
  private readonly renomeiaVegetacaoUseCase: RenomeiaVegetacaoUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaVegetacaoUseCase = dependencies.renomeiaVegetacaoUseCase
  }

  /**
   * Trata a requisição PUT /v1/vegetacoes/:vegetacaoId atualizando o nome da vegetação.
   *
   * @param request Requisição HTTP com parâmetro vegetacaoId e novo nome no corpo.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com a vegetação atualizada, 400 se parâmetros inválidos, 404 se não encontrada, 409 se duplicada ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }
    const { nome } = request.body as { nome?: string }

    if (vegetacaoId === undefined || vegetacaoId === null || vegetacaoId === '' || !/^\d+$/.test(vegetacaoId)) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da vegetação não pode ser vazio' })
    }

    const result = await this.renomeiaVegetacaoUseCase.execute({
      id: vegetacaoId,
      nome: nome.trim()
    })

    if (result.left()) {
      if (result.value instanceof VegetacaoJaExisteError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: 'Erro ao atualizar vegetação' })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    const body = vegetacaoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao atualizar vegetação' })
    }

    return { statusCode: StatusCode.Ok, body }
  }
}

/**
 * Formata a entidade Vegetacao para o payload de resposta HTTP.
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
