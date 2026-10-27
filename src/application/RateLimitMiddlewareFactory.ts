import { RateLimiterMemory } from 'rate-limiter-flexible'

import { HttpError } from '@/library/http/error/HttpError'
import { singleton } from '@/library/singleton'

import { RateLimitMiddleware } from './RateLimitMiddleware'

const createRateLimit = singleton(() => {
  return new RateLimitMiddleware({
    limiter: new RateLimiterMemory({
      points: 5,
      duration: 15 * 60
    }),
    isFailure: response => response instanceof HttpError && response.statusCode === 401
  })
})

export const rateLimit = createRateLimit()
