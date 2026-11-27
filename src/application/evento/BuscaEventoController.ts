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

/**
 * Controller responsável pelo endpoint de consulta detalhada de evento (GET /api/v1/eventos/:eventoId).
 */
export class BuscaEventoController implements RequestHandler {
  private readonly eventoCollection: EventoCollection

  /**
   * @param dependencies Repositório de consulta de eventos.
   */
  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
  }

  /**
   * Localiza e retorna o evento pelo ID fornecido na rota.
   *
   * @param request Requisição HTTP contendo ':eventoId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 200 com os dados do evento ou 400/404/500.
   */
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
