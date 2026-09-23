import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotaUseCase'
import { HttpRequest, HttpResponse, StatusCode } from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  SubstituiRotasUseCase: SubstituiRotasUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class SubstituiRotasController implements RequestHandler {
  private readonly SubstituiRotasUseCase: SubstituiRotasUseCase

  constructor(dependencies: Dependencies) {
    this.SubstituiRotasUseCase = dependencies.SubstituiRotasUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    try {
      const { expedicaoId } = request.params
      const { rotas } = request.body as { rotas?: number[] }

      if (expedicaoId === undefined || expedicaoId === null || expedicaoId === '' || typeof expedicaoId !== 'string' || !/^\d+$/.test(expedicaoId)) {
        return new BadRequestError({ message: 'expedicaoId inválido' })
      }

      if (!rotas || !Array.isArray(rotas) || rotas.some(id => typeof id !== 'number' || id <= 0)) {
        return new BadRequestError({ message: 'rotas inválidas' })
      }

      const result = await this.SubstituiRotasUseCase.execute(Number(expedicaoId), rotas)

      if (result.left()) {
        if (result.value.name === 'CollectionError' || result.value.message.includes('Falha')) {
          return new InternalServerError({ message: 'Falha interna ao substituir rotas' })
        }
        return new BadRequestError({ message: result.value.message })
      }

      return {
        statusCode: StatusCode.NoContent,
        body: undefined
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao substituir rotas'
      return new InternalServerError({ message: errorMessage })
    }
  }
}
