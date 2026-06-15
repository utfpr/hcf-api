import { Method } from './common'
import { RequestHandler } from './Server'

export interface Route {
  method: Method
  path: string
  handlers: RequestHandler[]
}
