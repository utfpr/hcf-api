import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'
import { RenomeiaFaseSucessionalUseCase } from '@/domain/faseSucessional/RenomeiaFaseSucessionalUseCase'
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
  renomeiaFaseSucessionalUseCase: RenomeiaFaseSucessionalUseCase
}

export class RenomeiaFaseSucessionalController implements RequestHandler {
  private readonly renomeiaFaseSucessionalUseCase: RenomeiaFaseSucessionalUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaFaseSucessionalUseCase = dependencies.renomeiaFaseSucessionalUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { faseSucessionalId } = request.params as { faseSucessionalId?: string }
    const { nome } = request.body as { nome?: string }

    if (
      faseSucessionalId === undefined
      || faseSucessionalId === null
      || faseSucessionalId === ''
      || Number.isNaN(Number(faseSucessionalId))
      || Number(faseSucessionalId) <= 0
    ) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da fase sucessional não pode ser vazio' })
    }

    const parsedId = Number(faseSucessionalId)
    const created = FaseSucessional.create({ id: parsedId, nome: nome.trim() })
    if (created.left()) {
      return new BadRequestError({ message: created.value.message })
    }

    const result = await this.renomeiaFaseSucessionalUseCase.execute({ id: parsedId, nome: nome.trim() })

    if (result.left()) {
      if (result.value.message === 'Já existe uma fase sucessional com esse nome') {
        return new ConflictError({ message: 'Já existe uma fase sucessional com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Fase sucessional não encontrada' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
