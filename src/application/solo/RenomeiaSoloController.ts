import { RenomeiaSoloUseCase } from '@/domain/solo/RenomeiaSoloUseCase'
import { Solo } from '@/domain/solo/Solo'
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
  renomeiaSoloUseCase: RenomeiaSoloUseCase
}

export class RenomeiaSoloController implements RequestHandler {
  private readonly renomeiaSoloUseCase: RenomeiaSoloUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaSoloUseCase = dependencies.renomeiaSoloUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { soloId } = request.params as { soloId?: string }
    const { nome } = request.body as { nome?: string }

    if (soloId === undefined || soloId === null || soloId === '' || !/^\d+$/.test(soloId)) {
      return new BadRequestError({ message: 'soloId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do solo não pode ser vazio' })
    }

    const normalized = nome.trim()
    const created = Solo.create({ id: 0, nome: normalized })
    if (created.left()) {
      return new BadRequestError({ message: created.value.message })
    }

    const result = await this.renomeiaSoloUseCase.execute({ id: Number(soloId), nome: normalized })

    if (result.left()) {
      if (result.value.message === 'Já existe um solo com esse nome') {
        return new ConflictError({ message: 'Já existe um solo com esse nome' })
      }
      return new InternalServerError({ message: result.value.message })
    }

    if (!result.value) {
      return new NotFoundError({ message: 'Solo não encontrado' })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
