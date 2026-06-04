import parser from 'body-parser'
import express from 'express'
import http from 'node:http'

import {
  Headers, HttpRequest, HttpResponse, Method
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { InternalServerError } from '@/library/http/error/InternalServerError'
import { RequestHandler } from '@/library/http/Server'
import { Logger } from '@/library/logger/Logger'
import { Application } from '@/library/Application'

interface Dependencies {
  logger: Logger
}

export class ExpressApplication implements Application {
  private readonly app: express.Application
  private readonly logger: Logger

  readonly server: http.Server

  constructor({ logger }: Dependencies) {
    this.app = express()
    this.app.use(parser.json())
    this.logger = logger

    this.server = http.createServer(this.app)
  }

  use(...args: unknown[]): this {
    (this.app.use as (...a: any[]) => void)(...args)
    return this
  }

  endpoint(method: Method, path: string, ...handlers: RequestHandler[]): this {
    this.app[method](
      path,
      async (expressRequest: express.Request, expressResponse: express.Response) => {
        const params = {
          ...expressRequest.params,
          ...expressRequest.query
        }
        const headers: Headers = {
          ...expressRequest.headers as Record<string, string>,
          'Content-Type': expressRequest.header('Content-Type') as Headers['Content-Type'],
          'Content-Length': expressRequest.header('Content-Length')
            ? Number(expressRequest.header('Content-Length'))
            : 0
        }

        const request: HttpRequest = {
          method,
          path: expressRequest.path,
          headers,
          params,
          body: expressRequest.body
        }

        const handlersClone = [...handlers]
        const next = async (): Promise<HttpResponse | HttpError> => {
          const handler = handlersClone.shift()
          if (handler) {
            return handler.handle(request, next)
          }
          return new InternalServerError({
            message: 'No next handler found',
            report: 'This usually happens when next() is called without any further handler'
          })
        }

        const response = await next()
        if (response) {
          this.processResponse(expressResponse, response)
        }
      }
    )
    return this
  }

  get(path: string, ...handlers: RequestHandler[]): this {
    return this.endpoint(Method.Get, path, ...handlers)
  }

  post(path: string, ...handlers: RequestHandler[]): this {
    return this.endpoint(Method.Post, path, ...handlers)
  }

  put(path: string, ...handlers: RequestHandler[]): this {
    return this.endpoint(Method.Put, path, ...handlers)
  }

  delete(path: string, ...handlers: RequestHandler[]): this {
    return this.endpoint(Method.Delete, path, ...handlers)
  }

  start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server
        .on('listening', () => {
          this.logger.info(`Server is running on port ${port}`)
          resolve()
        })
        .on('error', reject)
        .listen(port)
    })
  }

  shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close(error => {
        if (error) {
          reject(error)
          return
        }
        this.logger.info('Server shutdown successfully')
        resolve()
      })
    })
  }

  private processResponse(
    expressResponse: express.Response,
    response: HttpResponse | HttpError
  ): void {
    try {
      if (response instanceof Error) {
        this.logger.error(response.stack ?? response.message)
      }

      if (response instanceof HttpError) {
        expressResponse.status(response.statusCode).json({
          error: {
            statusCode: response.statusCode,
            name: response.name,
            message: response.message,
            report: response.report
          }
        })
        return
      }

      const contentType = response.headers?.['Content-Type'] ?? 'application/json'
      const body = response.body

      if (body instanceof Error) {
        expressResponse.json({
          error: { name: body.name, message: body.message }
        })
        return
      }

      if (contentType === 'application/json') {
        expressResponse.status(response.statusCode).json(body ?? null)
        return
      }

      expressResponse.status(response.statusCode).json(body ?? null)
    } catch (error) {
      this.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error))
      expressResponse.status(500).json({
        error: {
          statusCode: 500, name: 'InternalServerError', message: 'Unexpected error'
        }
      })
    }
  }
}
