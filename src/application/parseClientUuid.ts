const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `client_uuid` é a chave de idempotência que o app gera ao salvar offline.
 * Opcional: ausente (ou null) devolve undefined e o registro é criado normalmente.
 */
export function parseClientUuid(raw: unknown): string | undefined | Error {
  if (raw === undefined || raw === null || raw === '') {
    return undefined
  }
  if (typeof raw !== 'string' || !UUID.test(raw)) {
    return new Error('client_uuid inválido. Use um UUID')
  }
  return raw.toLowerCase()
}
