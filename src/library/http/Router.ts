import express from 'express'

import { Method } from './common'
import { RequestHandler } from './Server'

export interface Route {
  method: Method
  path: string
  handlers: RequestHandler[]
  middlewares?: express.RequestHandler[]
}
