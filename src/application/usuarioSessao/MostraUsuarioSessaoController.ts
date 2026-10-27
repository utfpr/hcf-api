import {
  type HttpRequest, type HttpResponse, StatusCode
} from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

import { notAuthorized } from './sessaoHttp'

export class MostraUsuarioSessaoController implements RequestHandler {
  handle(request: HttpRequest, _next: NextHandler): Promise<HttpResponse | HttpError> {
    if (!request.user || !request.auth) {
      return Promise.resolve(notAuthorized())
    }

    return Promise.resolve({
      statusCode: StatusCode.Ok,
      body: {
        user: request.user,
        rules: request.auth.rules
      }
    })
  }
}
