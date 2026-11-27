import { ExpedicaoCollection } from '@/domain/expedicao/ExpedicaoCollection'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  expedicaoCollection: ExpedicaoCollection
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

/**
 * Controller responsável pelo endpoint de desvinculação de participante de uma expedição (DELETE /api/v1/expedicoes/:expedicaoId/participantes/:usuarioId).
 */
export class RemoveParticipanteController implements RequestHandler {
  private readonly expedicaoCollection: ExpedicaoCollection

  /**
   * @param dependencies Repositório de expedições.
   */
  constructor(dependencies: Dependencies) {
    this.expedicaoCollection = dependencies.expedicaoCollection
  }

  /**
   * Remove o participante especificado da expedição.
   *
   * @param request Requisição HTTP contendo ':expedicaoId' e ':usuarioId'.
   * @param _next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP 204 NoContent, 400 por parâmetros inválidos ou 500 em falha interna.
   */
  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId, usuarioId } = request.params

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || typeof expedicaoId !== 'string' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (usuarioId === undefined || usuarioId === null || usuarioId === '' || typeof usuarioId !== 'string' || !/^\d+$/.test(usuarioId)) {
        return new BadRequestError({ message: 'usuarioId inválido' })
      }

      const result = await this.expedicaoCollection.removeParticipant(Number(expedicaoId), Number(usuarioId))

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
