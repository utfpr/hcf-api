import http from 'node:http'
import { Method } from './http/common'
import { RequestHandler } from './http/Server'

export interface Application {
  readonly server: http.Server

  use(...args: unknown[]): this
  endpoint(method: Method, path: string, ...handlers: RequestHandler[]): this
  get(path: string, ...handlers: RequestHandler[]): this
  post(path: string, ...handlers: RequestHandler[]): this
  put(path: string, ...handlers: RequestHandler[]): this
  delete(path: string, ...handlers: RequestHandler[]): this
  start(port: number): Promise<void>
  shutdown(): Promise<void>
}
