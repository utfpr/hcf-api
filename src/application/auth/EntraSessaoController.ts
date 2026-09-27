import { EntraSessaoUseCase } from '@/domain/auth/EntraSessaoUseCase'
import { type HttpRequest, type HttpResponse } from '@/library/http/common'
import { BadRequestError } from '@/library/http/error/BadRequestError'
import { type HttpError } from '@/library/http/error/HttpError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { toAccessTokenHttpResponse } from './toAccessTokenHttpResponse'
import { toHttpError } from './toHttpError'

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
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const senha = typeof body?.senha === 'string' ? body.senha : ''

    if (!email || !senha) {
      return new BadRequestError({ message: 'email and senha are required' })
    }

    const result = await this.entraSessaoUseCase.execute({ email, senha })
    if (result.left()) {
      return toHttpError(result.value)
    }

    return toAccessTokenHttpResponse(result.value)
  }
}
