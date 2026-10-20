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

export class RemoveLembreteUseCase {
  private readonly lembreteCollection: LembreteCollection
  private readonly lembreteEvidenciaCollection: LembreteEvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.lembreteCollection = dependencies.lembreteCollection
    this.lembreteEvidenciaCollection = dependencies.lembreteEvidenciaCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencias = await this.lembreteEvidenciaCollection.findAll({ lembrete_id: id })
    if (evidencias.left()) return Either.left(evidencias.value)

    // As linhas de lembretes_evidencias caem por CASCADE; os arquivos em disco não
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
