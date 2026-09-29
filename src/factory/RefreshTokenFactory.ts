import { CryptoRefreshToken } from '@/infrastructure/auth/CryptoRefreshToken'
import { singleton } from '@/library/singleton'

export const createRefreshToken = singleton(() => {
  return new CryptoRefreshToken()
})
