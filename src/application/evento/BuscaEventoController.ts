import { EventoCollection } from '@/domain/evento/EventoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  eventoCollection: EventoCollection
}

export class BuscaEventoController implements RequestHandler {
  private readonly eventoCollection: EventoCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { eventoId } = request.params as { eventoId?: string }

    if (
      eventoId === undefined
      || eventoId === null
      || eventoId === ''
      || !/^\d+$/.test(eventoId)
    ) {
      return new BadRequestError({ message: 'eventoId inválido' })
    }

    const result = await this.eventoCollection.findById(Number(eventoId))

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Evento não encontrado' })
    }

    return {
      statusCode: StatusCode.Ok,
      body: result.value
    }
  }
}
