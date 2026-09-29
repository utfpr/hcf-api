export function parseCorsOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') {
    throw new Error('CORS_ORIGINS must be an explicit comma-separated list of origins')
  }

  const origins = raw.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0)
  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ORIGINS must be an explicit list of origins and must not contain *')
  }

  return origins
}

export function assertCookieSafeOrigins(origins: string | string[]): string[] {
  const list = (Array.isArray(origins) ? origins : [origins])
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0)

  if (list.length === 0 || list.includes('*')) {
    throw new Error('CORS origins must be an explicit list and must not contain *')
  }

  return list
}
