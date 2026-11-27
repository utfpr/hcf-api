const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Valida e normaliza o identificador de idempotência (`client_uuid`) gerado pelo app móvel ao salvar offline.
 *
 * @param raw Valor bruto recebido na requisição HTTP (geralmente string UUID).
 * @returns String UUID normalizada em minúsculas, `undefined` se omitido/nulo, ou `Error` se o formato for inválido.
 */
export function parseClientUuid(raw: unknown): string | undefined | Error {
  if (raw === undefined || raw === null || raw === '') {
    return undefined
  }
  if (typeof raw !== 'string' || !UUID.test(raw)) {
    return new Error('client_uuid inválido. Use um UUID')
  }
  // Normaliza o UUID em minúsculas para garantir correspondência exata com índices únicos de idempotência no banco de dados durante retries offline do app
  return raw.toLowerCase()
}
