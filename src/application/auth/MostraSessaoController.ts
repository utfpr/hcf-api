import { MostraSessaoUseCase } from '@/domain/auth/MostraSessaoUseCase'
import { AccessTokenInvalidError } from '@/library/auth/error/AccessTokenInvalidError'
import {
  type HttpRequest, type HttpResponse, StatusCode
} from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { bearerAccessToken } from './requestAuth'
import { toHttpError } from './toHttpError'

interface Dependencies {
  mostraSessaoUseCase: MostraSessaoUseCase
}

export class MostraSessaoController implements RequestHandler {
  private readonly mostraSessaoUseCase: MostraSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.mostraSessaoUseCase = dependencies.mostraSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const accessToken = bearerAccessToken(request)
    if (!accessToken) {
      return toHttpError(new AccessTokenInvalidError())
    }

    const result = await this.mostraSessaoUseCase.execute({ accessToken })
    if (result.left()) {
      return toHttpError(result.value)
    }

    return {
      statusCode: StatusCode.Ok,
      body: result.value
    }
  }
}
