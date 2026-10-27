import { JwtAccessToken } from '@/infrastructure/auth/JwtAccessToken'
import { singleton } from '@/library/singleton'

export const createAccessToken = singleton(() => {
  return new JwtAccessToken({ secret: process.env.JWT_SECRET ?? '' })
})
