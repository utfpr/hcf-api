export interface LocalColetaRelation {
  id: number | string
  nome: string
  sigla?: string | null
  estado?: LocalColetaRelation | null
  pais?: LocalColetaRelation | null
}

export interface LocalColeta {
  id: number | string
  descricao: string | null
  cidade_id: number | string | null
  fase_sucessional_id: number | string | null
  cidade: LocalColetaRelation | null
  fase_sucessional: Pick<LocalColetaRelation, 'id' | 'nome'> | null
}
