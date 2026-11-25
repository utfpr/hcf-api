import { ReinoCollection } from '@/domain/reino/ReinoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  reinoCollection: ReinoCollection
}

export class BuscaReinoController implements RequestHandler {
  private readonly reinoCollection: ReinoCollection

  constructor(dependencies: Dependencies) {
    this.reinoCollection = dependencies.reinoCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { reinoId } = request.params as { reinoId?: string }
    if (reinoId === undefined || reinoId === null || reinoId === '' || !/^\d+$/.test(reinoId)) {
      return new BadRequestError({ message: 'reinoId inválido' })
    }

    const result = await this.reinoCollection.findById(reinoId)
    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Reino não encontrado' })
    }

    return {
      statusCode: StatusCode.Ok,
      body: { id: result.value.id, nome: result.value.nome }
    }
  }
}
