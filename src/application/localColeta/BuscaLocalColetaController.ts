import { LocalColetaCollection } from '@/domain/localColeta/LocalColetaCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class BuscaLocalColetaController implements RequestHandler {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { localColetaId } = request.params as { localColetaId?: string }
    if (localColetaId === undefined || !/^\d+$/.test(localColetaId) || !Number.isSafeInteger(Number(localColetaId)) || Number(localColetaId) <= 0 || Number(localColetaId) > 2147483647) {
      return new BadRequestError({ message: 'localColetaId inválido' })
    }

    try {
      const localColeta = await this.localColetaCollection.findById(localColetaId)
      if (localColeta.left()) {
        return new InternalServerError({ message: localColeta.value.message })
      }
      if (!localColeta.value) return new NotFoundError({ message: 'Local de coleta não encontrado' })
      return { statusCode: StatusCode.Ok, body: localColeta.value }
    } catch (error) {
      return new InternalServerError({
        message: 'Erro ao buscar local de coleta', cause: error
      })
    }
  }
}
