import { CadastraFaseSucessionalUseCase } from '@/domain/faseSucessional/CadastraFaseSucessionalUseCase'
import { FaseSucessionalNomeDuplicadoError } from '@/domain/faseSucessional/error/FaseSucessionalNomeDuplicadoError'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraFaseSucessionalUseCase: CadastraFaseSucessionalUseCase
}

export class CadastraFaseSucessionalController implements RequestHandler {
  private readonly cadastraFaseSucessionalUseCase: CadastraFaseSucessionalUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraFaseSucessionalUseCase = dependencies.cadastraFaseSucessionalUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome da fase sucessional não pode ser vazio' })
    }

    const result = await this.cadastraFaseSucessionalUseCase.execute({ nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof FaseSucessionalNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }

      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Created, body: result.value }
  }
}
