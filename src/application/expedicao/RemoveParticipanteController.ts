import { RemoveParticipanteUseCase, } from '@/domain/expedicao/RemoveParticipanteUseCase'
import { HttpRequest, HttpResponse, StatusCode } from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  removeParticipanteUseCase: RemoveParticipanteUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class RemoveParticipanteController implements RequestHandler {
  private readonly removeParticipanteUseCase: RemoveParticipanteUseCase

  constructor(dependencies: Dependencies) {
    this.removeParticipanteUseCase = dependencies.removeParticipanteUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId, usuarioId } = request.params

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || typeof expedicaoId !== 'string' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (usuarioId === undefined || usuarioId === null || usuarioId === '' || typeof usuarioId !== 'string' || !/^\d+$/.test(usuarioId)) {
        return new BadRequestError({ message: 'usuarioId inválido' })
      }

      const result = await this.removeParticipanteUseCase.execute(Number(expedicaoId), Number(usuarioId))

      if (result.left()) {
        if (result.value.name === 'CollectionError' || result.value.message.includes('Falha')) {
          return new InternalServerError({ message: 'Falha interna ao remover participante' })
        }
        return new BadRequestError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.NoContent,
        body: undefined
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao remover participante'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
