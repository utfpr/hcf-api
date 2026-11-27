import { FaseSucessional } from '@/domain/faseSucessional/FaseSucessional'

/**
 * Converte a entidade FaseSucessional para o formato de resposta HTTP (id e nome).
 *
 * @param fase Entidade FaseSucessional.
 * @returns Objeto com id e nome ou undefined se id for indefinido.
 */
export function faseSucessionalBody(fase: FaseSucessional): { id: string; nome: string } | undefined {
  if (fase.id === undefined) {
    return undefined
  }

  return { id: fase.id, nome: fase.nome }
}
