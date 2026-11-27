/**
 * Processa a variável de ambiente CORS_ORIGINS separando-a em uma lista de origens autorizadas.
 * Rejeita listas vazias e proíbe explicitamente o caractere curinga ('*').
 *
 * @param raw String bruta com origens separadas por vírgula vinda da variável de ambiente.
 * @returns Lista de strings com as origens permitidas.
 * @throws Error se a variável não estiver definida, for vazia ou contiver '*'.
 */
export function parseCorsOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') {
    throw new Error('CORS_ORIGINS must be an explicit comma-separated list of origins')
  }

  const origins = raw.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0)
  // Rejeita wildcard '*' para atender aos requisitos de segurança de CORS com suporte a credenciais (cookies)
  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ORIGINS must be an explicit list of origins and must not contain *')
  }

  return origins
}

/**
 * Valida se as origens configuradas são seguras para requisições com credenciais (cookies HTTP-only).
 * A especificação proíbe o cabeçalho 'Access-Control-Allow-Origin: *' quando 'Access-Control-Allow-Credentials' é 'true'.
 *
 * @param origins Origem ou lista de origens configuradas.
 * @returns Lista normalizada de origens seguras.
 * @throws Error se a lista for vazia ou contiver '*'.
 */
export function assertCookieSafeOrigins(origins: string | string[]): string[] {
  const list = (Array.isArray(origins) ? origins : [origins])
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0)

  if (list.length === 0 || list.includes('*')) {
    throw new Error('CORS origins must be an explicit list and must not contain *')
  }

  return list
}
