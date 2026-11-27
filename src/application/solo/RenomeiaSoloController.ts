import { SoloNaoEncontradoError } from '@/domain/solo/error/SoloNaoEncontradoError'
import { SoloNomeDuplicadoError } from '@/domain/solo/error/SoloNomeDuplicadoError'
import { RenomeiaSoloUseCase } from '@/domain/solo/RenomeiaSoloUseCase'
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

/**
 * Controller responsável pela alteração de nome de um tipo de solo.
 */
export class RenomeiaSoloController implements RequestHandler {
  private readonly renomeiaSoloUseCase: RenomeiaSoloUseCase

  constructor(dependencies: Dependencies) {
    this.renomeiaSoloUseCase = dependencies.renomeiaSoloUseCase
  }

  /**
   * Trata a requisição PUT /v1/solos/:soloId para renomear o solo.
   *
   * @param request Requisição HTTP com parâmetro de rota soloId e novo nome no corpo.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 200 com o solo atualizado, 400 se parâmetros inválidos, 404 se inexistente, 409 se duplicado ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { soloId } = request.params as { soloId?: string }
    const { nome } = request.body as { nome?: string }

    if (soloId === undefined || soloId === null || soloId === '' || !/^\d+$/.test(soloId)) {
      return new BadRequestError({ message: 'soloId inválido' })
    }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do solo não pode ser vazio' })
    }

    const result = await this.renomeiaSoloUseCase.execute({ id: Number(soloId), nome: nome.trim() })

    if (result.left()) {
      if (result.value instanceof SoloNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      if (result.value instanceof SoloNaoEncontradoError) {
        return new NotFoundError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Ok, body: result.value }
  }
}
