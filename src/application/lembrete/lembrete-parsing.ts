import { FICHA_FIELDS, FichaAttributes } from '@/domain/lembrete/Lembrete'

/**
 * Valida se um valor bruto representa um identificador inteiro positivo.
 *
 * @param raw Valor bruto a ser validado.
 * @param field Nome do campo para mensagem de erro.
 * @returns Número inteiro positivo ou Error de validação.
 */
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

/**
 * Expedição de onde o lembrete foi criado: opcional. Ausente ou null vira null;
 * aceita o id como número inteiro positivo (ou texto só com dígitos).
 *
 * @param raw Valor bruto correspondente ao campo 'expedicao_id'.
 * @returns ID da expedição, null se omitido/vazio ou Error de validação.
 */
export function parseExpedicaoId(raw: unknown): number | null | Error {
  if (raw === undefined || raw === null || raw === '') {
    return null
  }
  const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    return new Error('expedicao_id inválido. Use o id numérico da expedição')
  }
  return id
}

/**
 * Valida se o campo informado é uma string válida.
 *
 * @param raw Valor a testar.
 * @param field Nome do campo.
 * @returns String validada ou Error.
 */
export function parseRequiredString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido`)
  }
  return raw
}

/**
 * Campo opcional numérico: ausente fica `undefined` (na atualização, mantém o valor);
 * null limpa; número tem de ser finito.
 *
 * @param raw Valor a testar.
 * @param field Nome do campo.
 * @returns Número, null, undefined ou Error.
 */
export function parseOptionalNumber(raw: unknown, field: string): number | null | undefined | Error {
  if (raw === undefined || raw === null) {
    return raw
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return new Error(`${field} inválido`)
  }
  return raw
}

/**
 * Campo opcional string: ausente fica `undefined`; null limpa; exige tipo string.
 *
 * @param raw Valor a testar.
 * @param field Nome do campo.
 * @returns String, null, undefined ou Error.
 */
export function parseOptionalString(raw: unknown, field: string): string | null | undefined | Error {
  if (raw === undefined || raw === null) {
    return raw
  }
  if (typeof raw !== 'string') {
    return new Error(`${field} inválido`)
  }
  return raw
}

/**
 * Valida que o campo é uma string não vazia.
 *
 * @param raw Valor a testar.
 * @param field Nome do campo.
 * @returns String não vazia ou Error.
 */
export function parseNonEmptyString(raw: unknown, field: string): string | Error {
  if (typeof raw !== 'string' || !raw.trim()) {
    return new Error(`${field} é obrigatório`)
  }
  return raw
}

/**
 * Valida e converte string para data ISO 8601 válida.
 *
 * @param raw Valor a testar.
 * @param field Nome do campo.
 * @returns Instância de Date ou Error.
 */
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

/**
 * Gera a URL relativa pública para visualização da foto do lembrete.
 *
 * @param arquivo Nome do arquivo salvo.
 * @returns URL formatada sob '/images/lembretes/<arquivo>'.
 */
export function lembreteEvidenciaUrl(arquivo: string): string {
  return `/images/lembretes/${arquivo}`
}

/**
 * Lê só os campos da ficha que vieram no corpo. Com `preencherAusentes`, os
 * que faltam viram null (criação); sem, ficam de fora (atualização parcial).
 *
 * @param body Corpo da requisição com os campos da ficha.
 * @param options Opções indicando se campos ausentes devem ser preenchidos como null.
 * @returns Objeto com a ficha botânica normalizada ou Error de validação.
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
