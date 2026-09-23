declare module 'jsonwebtoken' {
  type JwtPayload = string | Record<string, unknown> | Buffer

  const jwt: {
    sign(
      payload: JwtPayload,
      secret: string | Buffer,
      options?: Record<string, unknown>
    ): string
    verify(
      token: string,
      secret: string | Buffer,
      options?: Record<string, unknown>
    ): unknown
  }

  export default jwt
}
