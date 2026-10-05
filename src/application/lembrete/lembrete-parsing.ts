import { FICHA_FIELDS, FichaAttributes } from '@/domain/lembrete/Lembrete'

export function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  return Number(raw)
}

export function parseRequiredString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido`)
  }
  return raw
}

/**
 * Lê só os campos da ficha que vieram no corpo. Com `preencherAusentes`, os
 * que faltam viram null (criação); sem, ficam de fora (atualização parcial).
 */
export function parseFicha(
  body: Record<string, unknown>,
  { preencherAusentes }: { preencherAusentes: boolean }
): Partial<FichaAttributes> | Error {
  const result: Partial<Record<keyof FichaAttributes, string | null>> = {}
  for (const campo of FICHA_FIELDS) {
    const value = body[campo]
    if (value === undefined) {
      if (preencherAusentes) result[campo] = null
      continue
    }
    if (value !== null && typeof value !== 'string') {
      return new Error(`${campo} inválido`)
    }
    result[campo] = value
  }
  return result
}
