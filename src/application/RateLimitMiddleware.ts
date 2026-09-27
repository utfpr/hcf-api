import {
  HttpRequest, HttpResponse
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { TooManyRequestsError } from '@/library/http/error/TooManyRequestsError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

export interface RateLimiter {
  get(key: string): Promise<{ remainingPoints: number; msBeforeNext: number } | null>
  consume(key: string, points?: number): Promise<unknown>
}

interface Dependencies {
  limiter: RateLimiter
  isFailure: (response: HttpResponse | HttpError) => boolean
}

export class RateLimitMiddleware implements RequestHandler {
  private readonly limiter: RateLimiter
  private readonly isFailure: (response: HttpResponse | HttpError) => boolean

  constructor(dependencies: Dependencies) {
    this.limiter = dependencies.limiter
    this.isFailure = dependencies.isFailure
  }

  async handle(request: HttpRequest, next: NextHandler): Promise<HttpResponse | HttpError> {
    const key = clientIp(request)
    const current = await this.limiter.get(key)
    if (current !== null && current.remainingPoints <= 0) {
      return new TooManyRequestsError({
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      })
    }

    const response = await next()
    if (this.isFailure(response)) {
      await this.limiter.consume(key).catch(() => undefined)
    }

    return response
  }
}

export function clientIp(request: HttpRequest): string {
  const forwarded = headerValue(request, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = headerValue(request, 'x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

function headerValue(request: HttpRequest, name: string): string | undefined {
  const value = request.headers[name]
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
