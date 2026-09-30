import { CadastraSoloUseCase } from '@/domain/solo/CadastraSoloUseCase'
import { Solo } from '@/domain/solo/Solo'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  cadastraSoloUseCase: CadastraSoloUseCase
}

export class CadastraSoloController implements RequestHandler {
  private readonly cadastraSoloUseCase: CadastraSoloUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraSoloUseCase = dependencies.cadastraSoloUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do solo não pode ser vazio' })
    }

    const normalized = nome.trim()
    const created = Solo.create({ id: 0, nome: normalized })
    if (created.left()) {
      return new BadRequestError({ message: created.value.message })
    }

    const result = await this.cadastraSoloUseCase.execute({ nome: normalized })

    if (result.left()) {
      if (result.value.message === 'Já existe um solo com esse nome') {
        return new ConflictError({ message: 'Já existe um solo com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Created, body: result.value }
  }
}
