import { CadastraVegetacaoUseCase } from '@/domain/vegetacao/CadastraVegetacaoUseCase'
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

    const normalized = nome.trim()
    const created = Vegetacao.create({ id: 0, nome: normalized })
    if (created.left()) {
      return new BadRequestError({ message: created.value.message })
    }

    const result = await this.cadastraVegetacaoUseCase.execute({ nome: normalized })

    if (result.left()) {
      if (result.value.message === 'Já existe uma vegetação com esse nome') {
        return new ConflictError({ message: 'Já existe uma vegetação com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Created, body: result.value }
  }
}
