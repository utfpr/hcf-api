import {
  type Headers, type HttpRequest, Method
} from '@/library/http/common'

export function httpRequest(overrides?: Partial<HttpRequest>): HttpRequest {
  return {
    body: {},
    cookies: {},
    headers: {} as Headers,
    method: Method.Post,
    params: {},
    path: '/auth',
    ...overrides
  }
}
