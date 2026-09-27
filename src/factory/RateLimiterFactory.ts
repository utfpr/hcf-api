import { RateLimiterMemory } from 'rate-limiter-flexible'

import { RateLimitMiddleware } from '@/application/RateLimitMiddleware'
import { HttpError } from '@/library/http/error/HttpError'
import { singleton } from '@/library/singleton'

const createRateLimiter = singleton(() => {
  return new RateLimiterMemory({
    points: 5,
    duration: 15 * 60
  })
})

export const rateLimitMiddleware = new RateLimitMiddleware({
  limiter: createRateLimiter(),
  isFailure: response => response instanceof HttpError && response.statusCode === 401
})
