import { CadastraRelevoUseCase } from '@/domain/relevo/CadastraRelevoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraRelevoUseCase: CadastraRelevoUseCase
}

export class CadastraRelevoController implements RequestHandler {
  private readonly cadastraRelevoUseCase: CadastraRelevoUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraRelevoUseCase = dependencies.cadastraRelevoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do relevo não pode ser vazio' })
    }

    const normalized = nome.trim()
    const result = await this.cadastraRelevoUseCase.execute({ nome: normalized })

    if (result.left()) {
      if (result.value.message === 'Já existe um relevo com esse nome') {
        return new ConflictError({ message: 'Já existe um relevo com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Created, body: result.value }
  }
}
