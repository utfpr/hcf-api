import { Either } from '@/library/either/Either'

export const EVENTO_TIPOS = ['DIARIO', 'COLETA'] as const

export type EventoTipo = typeof EVENTO_TIPOS[number]

export interface ColetaAttributes {
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

export interface Attributes {
  id: number
  expedicao_id: number
  tipo: EventoTipo
  capturado_em: Date
  latitude: number | null
  longitude: number | null
  altitude: number | null
  observacoes: string | null
  coleta: ColetaAttributes | null
  created_at: Date
  updated_at: Date
  created_by: number | null
  updated_by: number | null
}

export type CreateAttributes = Omit<Attributes, 'id' | 'created_at' | 'updated_at' | 'updated_by'>

export class Evento {
  readonly id: number
  readonly expedicao_id: number
  readonly tipo: EventoTipo
  readonly capturado_em: Date
  readonly latitude: number | null
  readonly longitude: number | null
  readonly altitude: number | null
  readonly observacoes: string | null
  readonly coleta: ColetaAttributes | null
  readonly created_at: Date
  readonly updated_at: Date
  readonly created_by: number | null
  readonly updated_by: number | null

  private constructor(attributes: Attributes) {
    this.id = attributes.id
    this.expedicao_id = attributes.expedicao_id
    this.tipo = attributes.tipo
    this.capturado_em = attributes.capturado_em
    this.latitude = attributes.latitude
    this.longitude = attributes.longitude
    this.altitude = attributes.altitude
    this.observacoes = attributes.observacoes
    this.coleta = attributes.coleta
    this.created_at = attributes.created_at
    this.updated_at = attributes.updated_at
    this.created_by = attributes.created_by
    this.updated_by = attributes.updated_by
  }

  static create(attributes: Attributes): Either<Error, Evento> {
    if (!Number.isInteger(attributes.expedicao_id) || attributes.expedicao_id <= 0) {
      return Either.left(new Error('Expedição do evento é obrigatória'))
    }

    if (!EVENTO_TIPOS.includes(attributes.tipo)) {
      return Either.left(new Error(`Tipo do evento deve ser um de: ${EVENTO_TIPOS.join(', ')}`))
    }

    if (Number.isNaN(attributes.capturado_em.getTime())) {
      return Either.left(new Error('Instante de captura do evento é inválido'))
    }

    if (attributes.tipo === 'COLETA' && !attributes.coleta) {
      return Either.left(new Error('Evento de coleta exige a ficha de coleta'))
    }

    if (attributes.tipo === 'DIARIO' && attributes.coleta) {
      return Either.left(new Error('Evento de diário não pode ter ficha de coleta'))
    }

    if (attributes.latitude !== null && (attributes.latitude < -90 || attributes.latitude > 90)) {
      return Either.left(new Error('Latitude do evento deve estar entre -90 e 90'))
    }

    if (attributes.longitude !== null && (attributes.longitude < -180 || attributes.longitude > 180)) {
      return Either.left(new Error('Longitude do evento deve estar entre -180 e 180'))
    }

    return Either.right(new Evento(attributes))
  }
}
