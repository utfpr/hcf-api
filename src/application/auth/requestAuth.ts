import { type HttpRequest } from '@/library/http/common'

export function headerValue(request: HttpRequest, name: string): string | undefined {
  const direct = request.headers[name]
  if (typeof direct === 'string' && direct.length > 0) {
    return direct
  }

  const lower = request.headers[name.toLowerCase()]
  if (typeof lower === 'string' && lower.length > 0) {
    return lower
  }

  return undefined
}

export function bearerAccessToken(request: HttpRequest): string | undefined {
  const authorization = headerValue(request, 'Authorization')
  if (!authorization) {
    return undefined
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  const token = match?.[1]?.trim()
  return token && token.length > 0 ? token : undefined
}

export function requestedWithHeader(request: HttpRequest): string | undefined {
  return headerValue(request, 'X-Requested-With')
}

export function bodyRefreshToken(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined
  }

  const value = (body as { refresh_token?: unknown }).refresh_token
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function cookieRefreshToken(request: HttpRequest): string | undefined {
  const value = request.cookies.refresh_token
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function resolveRefreshToken(request: HttpRequest): {
  token?: string
  fromCookie: boolean
  cookiePresent: boolean
} {
  const fromBody = bodyRefreshToken(request.body)
  const fromCookie = cookieRefreshToken(request)
  const cookiePresent = Boolean(fromCookie)

  if (fromBody) {
    return {
      token: fromBody,
      fromCookie: false,
      cookiePresent
    }
  }

  if (fromCookie) {
    return {
      token: fromCookie,
      fromCookie: true,
      cookiePresent: true
    }
  }

  return {
    fromCookie: false,
    cookiePresent
  }
}
