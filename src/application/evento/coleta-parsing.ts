import { COLETA_FIELDS, ColetaAttributes } from '@/domain/evento/Evento'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseColeta(raw: unknown): ColetaAttributes | Error {
  if (!isPlainObject(raw)) {
    return new Error('coleta inválido. Envie um objeto com os campos da ficha')
  }

  const result = {} as Record<string, string | null>
  for (const campo of COLETA_FIELDS) {
    const value = raw[campo]
    if (value === undefined) {
      result[campo] = null
      continue
    }
    if (value !== null && typeof value !== 'string') {
      return new Error(`coleta.${campo} inválido`)
    }
    result[campo] = value
  }
  return result as unknown as ColetaAttributes
}
