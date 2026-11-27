import { CadastraSoloUseCase } from '@/domain/solo/CadastraSoloUseCase'
import { SoloNomeDuplicadoError } from '@/domain/solo/error/SoloNomeDuplicadoError'
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

/**
 * Controller responsável pela criação de novos registros de tipo de solo.
 */
export class CadastraSoloController implements RequestHandler {
  private readonly cadastraSoloUseCase: CadastraSoloUseCase

  constructor(dependencies: Dependencies) {
    this.cadastraSoloUseCase = dependencies.cadastraSoloUseCase
  }

  /**
   * Trata a requisição POST /v1/solos para cadastrar um novo solo.
   *
   * @param request Requisição HTTP contendo o campo nome no corpo.
   * @param _next Próximo middleware da cadeia.
   * @returns Resposta HTTP 201 com o solo criado, 400 para nome inválido, 409 em caso de duplicidade ou 500.
   */
  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { nome } = request.body as { nome?: string }

    if (typeof nome !== 'string' || !nome.trim()) {
      return new BadRequestError({ message: 'Nome do solo não pode ser vazio' })
    }

    const normalized = nome.trim()
    const result = await this.cadastraSoloUseCase.execute({ nome: normalized })

    if (result.left()) {
      if (result.value instanceof SoloNomeDuplicadoError) {
        return new ConflictError({ message: result.value.message })
      }
      return new InternalServerError({ message: result.value.message })
    }

    return { statusCode: StatusCode.Created, body: result.value }
  }
}
