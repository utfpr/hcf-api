import {
  HttpRequest, HttpResponse, Method
} from './common'
import { HttpError } from './error/HttpError'

export interface NextHandler<ResponseBody = unknown> {
  (): Promise<HttpResponse<ResponseBody> | HttpError>
}

export interface RequestHandler<
  RequestBody = unknown,
  ResponseBody = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>
> {
  handle(
    request: HttpRequest<RequestBody, Params>,
    next: NextHandler<ResponseBody>,
  ): Promise<HttpResponse<ResponseBody> | HttpError>
}

export interface Server {
  endpoint(method: Method, path: string, ...handlers: RequestHandler[]): this
  get(path: string, ...handlers: RequestHandler[]): this
  post(path: string, ...handlers: RequestHandler[]): this
  put(path: string, ...handlers: RequestHandler[]): this
  delete(path: string, ...handlers: RequestHandler[]): this
  use(...args: unknown[]): this
  mount(router: unknown): this
  start(port: number): Promise<void>
  shutdown(): Promise<void>
}
