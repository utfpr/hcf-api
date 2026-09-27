import rateLimit from 'express-rate-limit'
import { EventEmitter } from 'node:events'

import {
  type HttpRequest, type HttpResponse, StatusCode
} from '@/library/http/common'
import { type HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { type NextHandler, type RequestHandler } from '@/library/http/Server'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  validate: false,
  message: {
    error: {
      code: 429,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
  },
  skipSuccessfulRequests: true,
  keyGenerator(request) {
    return typeof request.ip === 'string' && request.ip.length > 0 ? request.ip : 'unknown'
  }
})

class RateLimitResponse extends EventEmitter {
  statusCode: number = StatusCode.Ok
  headersSent = false
  writableEnded = false
  body: unknown

  status(statusCode: number): this {
    this.statusCode = statusCode
    return this
  }

  setHeader(): this {
    return this
  }

  send(body: unknown): this {
    this.body = body
    this.headersSent = true
    this.writableEnded = true
    this.emit('finish')
    return this
  }

  json(body: unknown): this {
    return this.send(body)
  }
}

export class RateLimitMiddleware implements RequestHandler {
  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    const clientIp = clientAddress(request)
    const expressRequest = {
      ip: clientIp,
      method: request.method,
      url: request.path,
      headers: request.headers
    }
    const expressResponse = new RateLimitResponse()

    return new Promise<HttpResponse | HttpError>((resolve, reject) => {
      let continued = false

      expressResponse.on('finish', () => {
        if (continued || expressResponse.statusCode !== StatusCode.TooManyRequests) {
          return
        }

        resolve({
          statusCode: StatusCode.TooManyRequests,
          body: expressResponse.body
        })
      })

      limiter(expressRequest as never, expressResponse as never, (error?: unknown) => {
        if (error) {
          reject(error instanceof Error ? error : new Error('Rate limit failed'))
          return
        }

        continued = true
        Promise.resolve(next())
          .then(result => {
            expressResponse.statusCode = result.statusCode
            expressResponse.emit('finish')
            resolve(result)
          })
          .catch(reject)
      })
    }).catch(error => new InternalServerError({
      message: error instanceof Error ? error.message : 'Rate limit failed',
      cause: error
    }))
  }
}

function clientAddress(request: HttpRequest): string {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  const realIp = request.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp
  }

  return 'unknown'
}
