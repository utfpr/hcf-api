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

/**
 * Instância singleton do middleware de rate limit para rotas sensíveis de autenticação.
 * Configurado em memória para tolerar até 5 falhas (HTTP 401) por IP a cada janela de 15 minutos,
 * mitigando ataques de força bruta em credenciais de usuário.
 */
export const rateLimit = createRateLimit()
