import { FICHA_FIELDS, FichaAttributes } from '@/domain/lembrete/Lembrete'

export function parseId(raw: unknown, field: string): number | Error {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return new Error(`${field} inválido`)
  }
  const id = Number(raw)
  if (id <= 0) {
    return new Error(`${field} inválido`)
  }
  return id
}

export function parseRequiredString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido`)
  }
  return raw
}

export function parseNonEmptyString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string' || !raw.trim()) {
    return new Error(`${field} é obrigatório`)
  }
  return raw
}

export function parseDate(raw: unknown, field: string): Date | Error {
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido. Use uma data no formato ISO 8601`)
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return new Error(`${field} inválido. Use uma data no formato ISO 8601`)
  }
  return date
}

export function lembreteEvidenciaUrl(arquivo: string): string {
  return `/uploads/lembretes/${arquivo}`
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
