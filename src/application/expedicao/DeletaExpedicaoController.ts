import { DeletaExpedicaoUseCase } from '@/domain/expedicao/DeletaExpedicaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { HttpError } from '@/library/http/error/HttpError'
import { NotFoundError } from '@/library/http/error/NotFoundError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

interface Dependencies {
  deletaExpedicaoUseCase: DeletaExpedicaoUseCase
}

interface CustomHttpRequest extends HttpRequest {
  usuario?: {
    id: number
    tipo_usuario_id: number
  }
}

export class DeletaExpedicaoController implements RequestHandler {
  private readonly deletaExpedicaoUseCase: DeletaExpedicaoUseCase

  constructor(dependencies: Dependencies) {
    this.deletaExpedicaoUseCase = dependencies.deletaExpedicaoUseCase
  }

  async handle(request: CustomHttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const { expedicaoId } = request.params

    if (!expedicaoId || Number.isNaN(Number(expedicaoId))) {
      return new BadRequestError({ message: 'O ID da expedição é inválido.' })
    }

    const result = await this.deletaExpedicaoUseCase.execute(Number(expedicaoId))

    if (result.left()) {
      return new NotFoundError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.NoContent
    }
  }
}
