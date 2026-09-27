import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { Either } from '@/library/either/Either'

import { EventoCollection } from './EventoCollection'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'evidencias')

interface Dependencies {
  eventoCollection: EventoCollection
  evidenciaCollection: EvidenciaCollection
}

export class RemoverEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly evidenciaCollection: EvidenciaCollection

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.evidenciaCollection = dependencies.evidenciaCollection
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencias = await this.evidenciaCollection.findAll({ evento_id: id })
    if (evidencias.left()) return Either.left(evidencias.value)

    const deleted = await this.eventoCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      await Promise.all(
        evidencias.value.map(evidencia =>
          unlink(path.join(UPLOADS_DIR, evidencia.arquivo)).catch((error: unknown) => {
            // eslint-disable-next-line no-console -- evento já apagado do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
            console.error(
              `Falha ao remover arquivo órfão de evidência (evento_id=${id}, arquivo=${evidencia.arquivo})`,
              error
            )
          })
        )
      )
    }

    return deleted
  }
}
