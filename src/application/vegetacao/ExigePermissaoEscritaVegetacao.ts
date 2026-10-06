import { authorize } from '@/library/auth/authorize'
import {
  HttpRequest,
  HttpResponse
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

export class ExigePermissaoEscritaVegetacao implements RequestHandler {
  private readonly handler: RequestHandler

  constructor() {
    this.handler = authorize('create', 'Vegetacao')
  }

  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    return this.handler.handle(request, next)
  }
}
