import { CadastraRelevoUseCase } from '@/domain/relevo/CadastraRelevoUseCase'
import { RelevoNomeDuplicadoError } from '@/domain/relevo/error/RelevoNomeDuplicadoError'
import { Relevo } from '@/domain/relevo/Relevo'
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

    const result = await this.cadastraRelevoUseCase.execute({ nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof RelevoNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    const body = relevoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao criar relevo' })
    }

    return { statusCode: StatusCode.Created, body }
  }
}

function relevoBody(relevo: Relevo): { id: string; nome: string } | undefined {
  if (relevo.id === undefined) {
    return undefined
  }

  return { id: relevo.id, nome: relevo.nome }
}
