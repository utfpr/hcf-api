import { type SessaoAutenticada } from '@/domain/auth/SessaoAutenticada'
import { type HttpResponse, StatusCode } from '@/library/http/common'

import { refreshCookieHeader } from './refreshCookieHeader'

export function sessaoHttpResponse(sessao: SessaoAutenticada): HttpResponse {
  return {
    statusCode: StatusCode.Ok,
    headers: {
      'Set-Cookie': refreshCookieHeader(sessao.refreshToken)
    },
    body: {
      access_token: sessao.accessToken,
      refresh_token: sessao.refreshToken,
      token_type: 'Bearer',
      expires_in: sessao.expiresIn,
      user: sessao.user,
      rules: sessao.rules
    }
  }
}
