import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { LEMBRETE_EVIDENCIA_DIR } from '@/config/evidencia'
import { Either } from '@/library/either/Either'

import { LembreteCollection } from './LembreteCollection'
import { LembreteEvidenciaCollection } from './LembreteEvidenciaCollection'

interface Dependencies {
  lembreteCollection: LembreteCollection
  lembreteEvidenciaCollection: LembreteEvidenciaCollection
}

/**
 * Caso de uso para remoção de lembrete e desalocação de todos os arquivos de evidências vinculados.
 */
export class RemoveLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  /**
   * @param dependencies Repositórios de lembretes e evidências de lembrete.
   */
  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  /**
   * Remove o lembrete do banco e expurga os arquivos físicos de suas evidências do disco.
   *
   * @param params Objeto contendo o ID numérico do lembrete.
   * @returns Either com booleano indicando se o lembrete foi removido ou erro de infraestrutura.
   */
  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencias = await this.lembreteEvidenciaCollection.findAll({ lembrete_id: id })
    if (evidencias.left()) return Either.left(evidencias.value)

    // As linhas de lembretes_evidencias caem por CASCADE no banco; os arquivos físicos em disco exigem exclusão explícita
    const deleted = await this.lembreteCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      await Promise.all(
        evidencias.value.map(evidencia =>
          unlink(path.join(LEMBRETE_EVIDENCIA_DIR, evidencia.arquivo)).catch((error: unknown) => {
            // eslint-disable-next-line no-console -- lembrete já apagado do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
            console.error(
              `Falha ao remover arquivo órfão de evidência do lembrete (lembrete_id=${id}, arquivo=${evidencia.arquivo})`,
              error
            )
          })
        )
      )
    }

    return deleted
  }
}
