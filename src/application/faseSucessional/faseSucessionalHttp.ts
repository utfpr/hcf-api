import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'

export function faseSucessionalBody(fase: FaseSucessional): { id: string; nome: string } | undefined {
  if (fase.id === undefined) {
    return undefined
  }

  return { id: fase.id, nome: fase.nome }
}
