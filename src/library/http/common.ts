import '@/library/enum'

import { type Action, type Resource } from '@/library/auth/createRules'
import { type Manager } from '@/library/auth/Manager'

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
  TooManyRequests: 429,
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
  'Set-Cookie'?: string
  [name: string]: HeaderValue
}

export interface RequestUser {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
}

export interface HttpRequest<
  Body = unknown,
  Params extends Record<string, unknown> = Record<string, unknown>
> {
  method: Method
  path: string
  headers: Headers
  cookies?: Record<string, string>
  params: Params
  body: Body
  user?: RequestUser
  auth?: Manager<Resource, Action>
}

export interface HttpResponse<Body = unknown> {
  statusCode: StatusCode
  headers?: Partial<Headers>
  body?: Body
}

/**
 * Assinatura estrutural de um middleware de framework (ex: Express), usada
 * pela camada http/Application agnóstica de framework. `req`/`res` ficam
 * como `any` de propósito: o formato real (Request/Response do Express) é
 * decidido por quem implementa `Application` — esta camada não deve
 * importar `express` diretamente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- req/res assumem o shape do framework concreto (ex: Express), decidido por quem implementa `Application`
export type RawMiddleware = (req: any, res: any, next: (err?: unknown) => void) => void
