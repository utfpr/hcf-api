export enum Method {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Delete = 'delete',
}

export enum StatusCode {
  Ok = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  UnprocessableEntity = 422,
  InternalServerError = 500,
}

type HeaderValue = string | number | boolean | null | undefined

type ContentTypeHeaderValue =
  | 'text/html'
  | 'text/plain'
  | 'multipart/form-data'
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'application/octet-stream'

export interface Headers {
  Authorization?: string
  'Content-Type': ContentTypeHeaderValue
  'Content-Length': number
  [name: string]: HeaderValue
}

export interface HttpRequest<
  Body = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>,
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
