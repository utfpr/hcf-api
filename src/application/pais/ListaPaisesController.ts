import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaPaisesUseCase: ListaPaisesUseCase
}

export class ListaPaisesController implements RequestHandler {
  private readonly listaPaisesUseCase: ListaPaisesUseCase

  constructor(dependencies: Dependencies) {
    this.listaPaisesUseCase = dependencies.listaPaisesUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const result = await this.listaPaisesUseCase.execute({
      nome: request.params.nome as string | undefined
    })

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
