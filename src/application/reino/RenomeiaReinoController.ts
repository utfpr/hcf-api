import { ReinoNaoEncontradoError } from '@/domain/reino/error/ReinoNaoEncontradoError'
import { ReinoNomeDuplicadoError } from '@/domain/reino/error/ReinoNomeDuplicadoError'
import { Reino } from '@/domain/reino/Reino'
import { RenomeiaReinoUseCase } from '@/domain/reino/RenomeiaReinoUseCase'
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
  renomeiaReinoUseCase: RenomeiaReinoUseCase
}

export class RenomeiaReinoController implements RequestHandler {
  private readonly renomeiaReinoUseCase: RenomeiaReinoUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaReinoUseCase = dependencies.renomeiaReinoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { reinoId } = request.params as { reinoId?: string }
    const { nome } = request.body as { nome?: string }

    if (reinoId === undefined || reinoId === null || reinoId === '' || !/^\d+$/.test(reinoId)) {
      return new BadRequestError({ message: 'reinoId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do reino não pode ser vazio' })
    }

    const result = await this.renomeiaReinoUseCase.execute({ id: reinoId, nome: nome.trim() })
    if (result.left()) {
      if (result.value instanceof ReinoNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof ReinoNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    const body = reinoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao atualizar reino' })
    }

    return { statusCode: StatusCode.Ok, body }
  }
}

function reinoBody(reino: Reino): { id: string; nome: string } | undefined {
  if (reino.id === undefined) {
    return undefined
  }

  return { id: reino.id, nome: reino.nome }
}
