import { Either } from '@/library/either/Either'

export interface FichaAttributes {
  familia: string | null
  nome_popular: string | null
  nome_cientifico: string | null
  municipio: string | null
  estado: string | null
  referencia_local: string | null
  tipo_vegetacao: string | null
  solo: string | null
  relevo: string | null
  substrato: string | null
  tronco_com_casca: string | null
  associacoes: string | null
  folhas: string | null
  habito: string | null
  frutos: string | null
  flores: string | null
  luminosidade: string | null
}

/**
 * Lista de campos da ficha do lembrete (clone da ficha de coleta do evento).
 */
export const FICHA_FIELDS = [
  'familia',
  'nome_popular',
  'nome_cientifico',
  'municipio',
  'estado',
  'referencia_local',
  'tipo_vegetacao',
  'solo',
  'relevo',
  'substrato',
  'tronco_com_casca',
  'associacoes',
  'folhas',
  'habito',
  'frutos',
  'flores',
  'luminosidade'
] as const satisfies ReadonlyArray<keyof FichaAttributes>

export interface Attributes extends FichaAttributes {
  id: number
  data_coleta: string
  local_coleta: string
  created_at: Date
  updated_at: Date
  created_by: number | null
  updated_by: number | null
}

export type CreateAttributes = Omit<Attributes, 'id' | 'created_at' | 'updated_at' | 'updated_by'>

export type UpdateAttributes = Omit<Attributes, 'id' | 'created_at' | 'updated_at' | 'created_by'>

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Aceita apenas YYYY-MM-DD de um dia que existe (rejeita 2026-02-30, que o
 * Date normalizaria para março).
 */
export function isDataValida(value: string): boolean {
  if (!DATA_ISO.test(value)) {
    return false
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export class Lembrete {
  readonly id: number
  readonly data_coleta: string
  readonly local_coleta: string
  readonly ficha: FichaAttributes
  readonly created_at: Date
  readonly updated_at: Date
  readonly created_by: number | null
  readonly updated_by: number | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.data_coleta = attributes.data_coleta
    this.local_coleta = attributes.local_coleta
    this.ficha = Object.fromEntries(
      FICHA_FIELDS.map(campo => [campo, attributes[campo]])
    ) as unknown as FichaAttributes
    this.created_at = attributes.created_at
    this.updated_at = attributes.updated_at
    this.created_by = attributes.created_by
    this.updated_by = attributes.updated_by
  }

  static create(attributes: Attributes): Either<Error, Lembrete> {
    if (typeof attributes.data_coleta !== 'string' || !isDataValida(attributes.data_coleta)) {
      return Either.left(new Error('Data de coleta do lembrete é obrigatória e deve estar no formato YYYY-MM-DD'))
    }

    if (typeof attributes.local_coleta !== 'string' || attributes.local_coleta.trim() === '') {
      return Either.left(new Error('Local de coleta do lembrete é obrigatório'))
    }

    return Either.right(new Lembrete(attributes))
  }
}
