import { RateLimiterMemory } from 'rate-limiter-flexible'

import { singleton } from '@/library/singleton'

export const createRateLimiter = singleton(() => {
  return new RateLimiterMemory({
    points: 5,
    duration: 15 * 60
  })
})
