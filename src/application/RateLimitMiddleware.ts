import {
  HttpRequest, HttpResponse
} from '@/library/http/common'
import { HttpError } from '@/library/http/error/HttpError'
import { TooManyRequestsError } from '@/library/http/error/TooManyRequestsError'
import { NextHandler, RequestHandler } from '@/library/http/Server'

/**
 * Contrato de limitador de taxa de requisições (Rate Limiter).
 */
export interface RateLimiter {
  /**
   * Consulta os pontos restantes e o tempo até o reset para a chave fornecida.
   *
   * @param key Identificador da chave de rate limit (ex.: IP do cliente).
   * @returns Objeto com pontos restantes e milissegundos restantes, ou null se não houver registros.
   */
  get(key: string): Promise<{ remainingPoints: number; msBeforeNext: number } | null>

  /**
   * Consome pontos da cota da chave especificada.
   *
   * @param key Identificador da chave de rate limit.
   * @param points Quantidade de pontos a consumir.
   */
  consume(key: string, points?: number): Promise<unknown>
}

interface Dependencies {
  limiter: RateLimiter
  isFailure: (response: HttpResponse | HttpError) => boolean
}

/**
 * Middleware para mitigação de ataques de força bruta limitando taxa de requisições por IP de origem.
 * Retorna erro 429 (TooManyRequestsError) caso a cota se esgote, consumindo pontos
 * apenas quando a resposta é avaliada como falha pela função `isFailure` (ex.: falha de credenciais).
 */
export class RateLimitMiddleware implements RequestHandler {
  private readonly limiter: RateLimiter
  private readonly isFailure: (response: HttpResponse | HttpError) => boolean

  /**
   * @param dependencies Instância do limitador e função de avaliação de resposta de falha.
   */
  constructor(dependencies: Dependencies) {
    this.limiter = dependencies.limiter
    this.isFailure = dependencies.isFailure
  }

  /**
   * Intercepta a requisição verificando se o IP excedeu a cota e penaliza tentativas com falha.
   *
   * @param request Requisição HTTP interceptada.
   * @param next Próximo manipulador na cadeia de execução.
   * @returns Resposta HTTP gerada ou TooManyRequestsError caso a cota do IP tenha se esgotado.
   */
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
      // Consome cota de tentativas apenas em caso de respostas de falha (ex.: 401 Unauthorized), evitando penalizar requisições bem-sucedidas
      await this.limiter.consume(key).catch(() => undefined)
    }

    return response
  }
}

/**
 * Extrai o IP real do cliente a partir dos cabeçalhos de proxy reverso ('x-forwarded-for' ou 'x-real-ip').
 *
 * @param request Requisição HTTP recebida.
 * @returns Endereço IP detectado ou 'unknown'.
 */
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
