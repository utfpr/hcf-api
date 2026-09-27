import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { EVIDENCIA_DIR } from '@/config/evidencia'
import { Either } from '@/library/either/Either'

import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
}

export class RemoverEvidenciaUseCase {
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencia = await this.evidenciaCollection.findById(id)
    if (evidencia.left()) return Either.left(evidencia.value)
    if (!evidencia.value) return Either.right(false)

    const deleted = await this.evidenciaCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      const { arquivo } = evidencia.value

      await unlink(path.join(EVIDENCIA_DIR, arquivo)).catch((error: unknown) => {
        // eslint-disable-next-line no-console -- evidência já apagada do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
        console.error(
          `Falha ao remover arquivo órfão de evidência (evidencia_id=${id}, arquivo=${arquivo})`,
          error
        )
      })
    }

    return deleted
  }
}
