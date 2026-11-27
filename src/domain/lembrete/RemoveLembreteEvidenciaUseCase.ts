import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { LEMBRETE_EVIDENCIA_DIR } from '@/config/evidencia'
import { Either } from '@/library/either/Either'

import { LembreteEvidenciaCollection } from './LembreteEvidenciaCollection'

interface Dependencies {
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

/**
 * Caso de uso para remoção de uma evidência específica de um lembrete e seu respectivo arquivo em disco.
 */
export class RemoveLembreteEvidenciaUseCase {
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  /**
   * @param dependencies Repositório de evidências de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  /**
   * Remove o registro da evidência se pertencer ao lembrete informado e apaga o arquivo do disco.
   *
   * @param params IDs da evidência e do lembrete associado.
   * @returns Either com booleano indicando sucesso ou erro de infraestrutura.
   */
  async execute({ id, lembreteId }: { id: number; lembreteId: number }): Promise<Either<Error, boolean>> {
    const evidencia = await this.lembreteEvidenciaCollection.findById(id)
    if (evidencia.left()) return Either.left(evidencia.value)
    if (!evidencia.value || evidencia.value.lembrete_id !== lembreteId) return Either.right(false)

    const deleted = await this.lembreteEvidenciaCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      const { arquivo } = evidencia.value

      // Desaloca o arquivo físico em disco associado à evidência removida
      await unlink(path.join(LEMBRETE_EVIDENCIA_DIR, arquivo)).catch((error: unknown) => {
        // eslint-disable-next-line no-console -- evidência já apagada do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
        console.error(
          `Falha ao remover arquivo órfão de evidência do lembrete (lembrete_evidencia_id=${id}, arquivo=${arquivo})`,
          error
        )
      })
    }

    return deleted
  }
}
