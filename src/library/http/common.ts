import '@/library/enum'

export const Method = {
  Get: 'get',
  Post: 'post',
  Put: 'put',
  Delete: 'delete'
} as const

export type Method = EnumOf<typeof Method>

export const StatusCode = {
  Ok: 200,
  Created: 201,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  InternalServerError: 500
} as const

export type StatusCode = EnumOf<typeof StatusCode>

type HeaderValue = string | number | boolean | null | undefined

type ContentTypeHeaderValue =
  | 'application/json'
  | 'application/octet-stream'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/html'
  | 'text/plain'

export interface Headers {
  Authorization?: string
  'Content-Length': number
  'Content-Type': ContentTypeHeaderValue
  [name: string]: HeaderValue
}

export interface HttpRequest<
  Body = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>
> {
  method: Method
  path: string
  headers: Headers
  params: Params
  body: Body
}

export interface HttpResponse<Body = unknown> {
  statusCode: StatusCode
  headers?: Partial<Headers>
  body?: Body
}
