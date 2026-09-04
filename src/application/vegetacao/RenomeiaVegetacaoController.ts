import { RenomeiaVegetacaoUseCase } from '@/domain/vegetacao/RenomeiaVegetacaoUseCase'
import { Vegetacao } from '@/domain/vegetacao/Vegetacao'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  renomeiaVegetacaoUseCase: RenomeiaVegetacaoUseCase
}

export class RenomeiaVegetacaoController implements RequestHandler {
  private readonly renomeiaVegetacaoUseCase: RenomeiaVegetacaoUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaVegetacaoUseCase = dependencies.renomeiaVegetacaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { vegetacaoId } = request.params as { vegetacaoId?: string }
    const { nome } = request.body as { nome?: string }

    if (
      vegetacaoId === undefined
      || vegetacaoId === null
      || vegetacaoId === ''
      || Number.isNaN(Number(vegetacaoId))
      || Number(vegetacaoId) <= 0
    ) {
      return new BadRequestError({ message: 'vegetacaoId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da vegetação não pode ser vazio' })
    }

    const parsedId = Number(vegetacaoId)
    const created = Vegetacao.create({ id: parsedId, nome: nome.trim() })
    if (created.left()) {
      return new BadRequestError({ message: created.value.message })
    }

    const result = await this.renomeiaVegetacaoUseCase.execute({ id: parsedId, nome: nome.trim() })

    if (result.left()) {
      const message = result.value.message.toLowerCase()
      if (message.includes('duplicate') || message.includes('unique') || message.includes('already') || message.includes('exist')) {
        return new BadRequestError({ message: 'Já existe uma vegetação com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Vegetação não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
