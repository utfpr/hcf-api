import { CredenciaisInvalidasError } from '@/domain/usuario/error/CredenciaisInvalidasError'
import { type EntraSessaoUseCase } from '@/domain/usuarioSessao/EntraSessaoUseCase'
import {
  HttpRequest, HttpResponse, StatusCode
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { serializeRefreshCookie } from './refreshCookie'
import { credenciaisInvalidas, sessaoResponseBody } from './sessaoHttp'

interface Dependencies {
  entraSessaoUseCase: EntraSessaoUseCase
}

export class EntraSessaoController implements RequestHandler {
  private readonly entraSessaoUseCase: EntraSessaoUseCase

  constructor(dependencies: Dependencies) {
    this.entraSessaoUseCase = dependencies.entraSessaoUseCase
  }

  async handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    const body = request.body as { email?: unknown; senha?: unknown }
    const email = typeof body?.email === 'string' ? body.email : ''
    const senha = typeof body?.senha === 'string' ? body.senha : ''

    const result = await this.entraSessaoUseCase.execute({ email, senha })
    if (result.left()) {
      if (result.value instanceof CredenciaisInvalidasError) {
        return credenciaisInvalidas()
      }
      return new InternalServerError({ message: result.value.message })
    }

    return {
      statusCode: StatusCode.Ok,
      headers: { 'Set-Cookie': serializeRefreshCookie(result.value.refreshToken) },
      body: sessaoResponseBody(result.value)
    }
  }
}
