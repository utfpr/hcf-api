import { EventoTipo } from '@/domain/evento/Evento'
import { ListaEventosUseCase } from '@/domain/evento/ListaEventosUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  listaEventosUseCase: ListaEventosUseCase
}

export class ListaEventosController implements RequestHandler {
  private readonly listaEventosUseCase: ListaEventosUseCase

  constructor(dependencies: Dependencies) {
    this.listaEventosUseCase = dependencies.listaEventosUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const {
      expedicaoId,
      tipo,
      data_captura_de,
      data_captura_ate,
      limite,
      pagina
    } = request.params as {
      expedicaoId?: string
      tipo?: string
      data_captura_de?: string
      data_captura_ate?: string
      limite?: string
      pagina?: string
    }

    if (
      expedicaoId === undefined
      || expedicaoId === null
      || expedicaoId === ''
      || !/^\d+$/.test(expedicaoId)
    ) {
      return new BadRequestError({ message: 'expedicaoId inválido' })
    }

    const filters = {
      expedicao_id: Number(expedicaoId),
      ...(limite && !Number.isNaN(Number(limite))
        ? { limite: Number(limite) }
        : {}),
      ...(pagina && !Number.isNaN(Number(pagina))
        ? { pagina: Number(pagina) }
        : {}),
      ...(tipo ? { tipo: tipo as EventoTipo } : {}),
      ...(data_captura_de ? { data_captura_de: new Date(data_captura_de) } : {}),
      ...(data_captura_ate ? { data_captura_ate: new Date(data_captura_ate) } : {})
    }

    const result = await this.listaEventosUseCase.execute(filters)

    if (result.left()) {
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      body: result.value
    }
  }
}
