import { RelevoNaoEncontradoError } from '@/domain/relevo/error/RelevoNaoEncontradoError'
import { RelevoNomeDuplicadoError } from '@/domain/relevo/error/RelevoNomeDuplicadoError'
import { Relevo } from '@/domain/relevo/Relevo'
import { RenomeiaRelevoUseCase } from '@/domain/relevo/RenomeiaRelevoUseCase'
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
  renomeiaRelevoUseCase: RenomeiaRelevoUseCase
}

export class RenomeiaRelevoController implements RequestHandler {
  private readonly renomeiaRelevoUseCase: RenomeiaRelevoUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaRelevoUseCase = dependencies.renomeiaRelevoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { relevoId } = request.params as { relevoId?: string }
    const { nome } = request.body as { nome?: string }

    if (relevoId === undefined || relevoId === null || relevoId === '' || !/^\d+$/.test(relevoId)) {
      return new BadRequestError({ message: 'relevoId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do relevo não pode ser vazio' })
    }

    const result = await this.renomeiaRelevoUseCase.execute({ id: relevoId, nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof RelevoNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof RelevoNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    const body = relevoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao atualizar relevo' })
    }

    return { statusCode: StatusCode.Ok, body }
  }
}

function relevoBody(relevo: Relevo): { id: string; nome: string } | undefined {
  if (relevo.id === undefined) {
    return undefined
  }

  return { id: relevo.id, nome: relevo.nome }
}
