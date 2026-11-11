import { LocalColetaDescricaoDuplicadaError } from '@/domain/localColeta/error/LocalColetaDescricaoDuplicadaError'
import { LocalColetaNaoEncontradaError } from '@/domain/localColeta/error/LocalColetaNaoEncontradaError'
import { RenomeiaLocalColetaUseCase } from '@/domain/localColeta/RenomeiaLocalColetaUseCase'
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
  renomeiaLocalColetaUseCase: RenomeiaLocalColetaUseCase
}

export class RenomeiaLocalColetaController implements RequestHandler {
  private readonly renomeiaLocalColetaUseCase: RenomeiaLocalColetaUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaLocalColetaUseCase = dependencies.renomeiaLocalColetaUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { localColetaId } = request.params as { localColetaId?: string }
    if (localColetaId === undefined || localColetaId === null || localColetaId === '' || !/^\d+$/.test(localColetaId)) {
      return new BadRequestError({ message: 'localColetaId inválido' })
    }

    const {
      descricao, cidade_id, fase_sucessional_id
    } = request.body as {
      descricao?: unknown
      cidade_id?: unknown
      fase_sucessional_id?: unknown
    }
    const cidadeIdValido = typeof cidade_id === 'number'
      ? Number.isInteger(cidade_id)
      : typeof cidade_id === 'string' && /^-?\d+$/.test(cidade_id)
    const faseIdValido = fase_sucessional_id === undefined
      || fase_sucessional_id === null
      || (typeof fase_sucessional_id === 'number'
        ? Number.isInteger(fase_sucessional_id)
        : typeof fase_sucessional_id === 'string' && /^-?\d+$/.test(fase_sucessional_id))

    if (typeof descricao !== 'string' || !descricao.trim() || !cidadeIdValido || !faseIdValido) {
      return new BadRequestError({ message: 'Descrição e cidade são obrigatórias; os IDs devem ser inteiros' })
    }

    const attributes = {
      descricao,
      cidade_id: Number(cidade_id),
      ...(fase_sucessional_id === undefined
        ? {}
        : { fase_sucessional_id: fase_sucessional_id === null ? null : Number(fase_sucessional_id) })
    }
    const result = await this.renomeiaLocalColetaUseCase.execute(localColetaId, attributes)
    if (result.left()) {
      if (result.value instanceof LocalColetaDescricaoDuplicadaError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof LocalColetaNaoEncontradaError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
