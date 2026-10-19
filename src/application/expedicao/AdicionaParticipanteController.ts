import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdcionaParticipanteUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { ConflictError } from '@/library/http/error/ConflictError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  adicionaParticipanteUseCase: AdicionaParticipanteUseCase
}

export class AdicionaParticipanteController implements RequestHandler {
  private readonly adicionaParticipanteUseCase: AdicionaParticipanteUseCase

  constructor(dependencies: Dependencies) {
    this.adicionaParticipanteUseCase = dependencies.adicionaParticipanteUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params as { expedicaoId?: string }
      const { usuarioId } = (request.body ?? {}) as { usuarioId?: number }
      if (!expedicaoId || typeof expedicaoId !== 'string' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (usuarioId === undefined || typeof usuarioId !== 'number' || usuarioId <= 0) {
        return new BadRequestError({ message: 'usuarioId inválido' })
      }

      const result = await this.adicionaParticipanteUseCase.execute(
        Number(expedicaoId),
        usuarioId,
        request.user?.id ?? null
      )

      if (result.left()) {
        const error = result.value
        if (error.name === 'DuplicateParticipantError') {
          return new ConflictError({ message: error.message })
        }
        if (error.name === 'CollectionError') {
          return new InternalServerError({ message: 'Falha interna ao adicionar participante' })
        }
        return new BadRequestError({ message: error.message })
      }

      return {
        statusCode: StatusCode.Created,
        body: { message: 'Participante adicionado com sucesso.' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao adicionar participante'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
