import { FaseSucessionalNaoEncontradoError } from '@/domain/faseSucessional/error/FaseSucessionalNaoEncontradoError'
import { FaseSucessionalNomeDuplicadoError } from '@/domain/faseSucessional/error/FaseSucessionalNomeDuplicadoError'
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

import { faseSucessionalBody } from './faseSucessionalHttp'

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

    if (faseSucessionalId === undefined || faseSucessionalId === null || faseSucessionalId === '' || !/^\d+$/.test(faseSucessionalId)) {
      return new BadRequestError({ message: 'faseSucessionalId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da fase sucessional não pode ser vazio' })
    }

    const result = await this.renomeiaFaseSucessionalUseCase.execute({ id: faseSucessionalId, nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof FaseSucessionalNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }

      if (result.value instanceof FaseSucessionalNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }

      return new InternalServerError({ message: result.value.message })
    }

    const body = faseSucessionalBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao atualizar fase sucessional' })
    }

    return { statusCode: StatusCode.Ok, body }
  }
}
