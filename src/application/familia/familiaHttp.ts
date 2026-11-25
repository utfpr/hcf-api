import { Familia } from '@/domain/familia/Familia'

export interface FamiliaBody {
  id: number
  nome: string
  reino: { id: number; nome: string } | null
}

export function familiaBody(familia: Familia): FamiliaBody {
  return {
    id: familia.id,
    nome: familia.nome,
    reino: familia.reino ? { id: familia.reino.id, nome: familia.reino.nome } : null
  }
}
