import { EvidenciaArquivo } from '@/domain/evidencia/EvidenciaArquivo'
import { EvidenciaCollection } from '@/domain/evidencia/EvidenciaCollection'
import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

import { EventoCollection } from './EventoCollection'

interface Dependencies {
  eventoCollection: EventoCollection
  evidenciaCollection: EvidenciaCollection
  evidenciaArquivo: EvidenciaArquivo
  logger: Logger
}

export class RemoveEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly evidenciaCollection: EvidenciaCollection
  private readonly evidenciaArquivo: EvidenciaArquivo
  private readonly logger: Logger

  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.evidenciaArquivo = dependencies.evidenciaArquivo
    this.logger = dependencies.logger
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencias = await this.evidenciaCollection.findAll({ evento_id: id })
    if (evidencias.left()) return Either.left(evidencias.value)

    const deleted = await this.eventoCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      await Promise.all(evidencias.value.map(async ({ arquivo }) => {
        const removido = await this.evidenciaArquivo.remove(arquivo)

        // evento já apagado do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
        if (removido.left()) {
          this.logger.error('Falha ao remover arquivo órfão de evidência', {
            evento_id: id, arquivo, error: removido.value.message
          })
        }
      }))
    }

    return deleted
  }
}
