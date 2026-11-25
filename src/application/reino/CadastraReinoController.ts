import { CadastraReinoUseCase } from '@/domain/reino/CadastraReinoUseCase'
import { ReinoNomeDuplicadoError } from '@/domain/reino/error/ReinoNomeDuplicadoError'
import { Reino } from '@/domain/reino/Reino'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraReinoUseCase: CadastraReinoUseCase
}

export class CadastraReinoController implements RequestHandler {
  private readonly cadastraReinoUseCase: CadastraReinoUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraReinoUseCase = dependencies.cadastraReinoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }
    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do reino não pode ser vazio' })
    }

    const result = await this.cadastraReinoUseCase.execute({ nome: nome.trim() })
    if (result.left()) {
      if (result.value instanceof ReinoNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    const body = reinoBody(result.value)
    if (!body) {
      return new InternalServerError({ message: 'Erro ao criar reino' })
    }

    return { statusCode: StatusCode.Created, body }
  }
}

function reinoBody(reino: Reino): { id: string; nome: string } | undefined {
  if (reino.id === undefined) {
    return undefined
  }

  return { id: reino.id, nome: reino.nome }
}
