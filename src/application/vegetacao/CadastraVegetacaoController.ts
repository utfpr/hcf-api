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

export class CadastraVegetacaoController implements RequestHandler {
  private readonly cadastraVegetacaoUseCase: CadastraVegetacaoUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraVegetacaoUseCase = dependencies.cadastraVegetacaoUseCase
  }

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

function vegetacaoBody(vegetacao: Vegetacao): { id: string; nome: string } | undefined {
  if (vegetacao.id === undefined) {
    return undefined
  }

  return { id: vegetacao.id, nome: vegetacao.nome }
}
