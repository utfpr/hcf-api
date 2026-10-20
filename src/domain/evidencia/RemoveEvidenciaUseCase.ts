import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

import { EvidenciaArquivo } from './EvidenciaArquivo'
import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
  evidenciaArquivo: EvidenciaArquivo
  logger: Logger
}

export class RemoveEvidenciaUseCase {
  private readonly evidenciaCollection: EvidenciaCollection
  private readonly evidenciaArquivo: EvidenciaArquivo
  private readonly logger: Logger

  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.evidenciaArquivo = dependencies.evidenciaArquivo
    this.logger = dependencies.logger
  }

  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencia = await this.evidenciaCollection.findById(id)
    if (evidencia.left()) return Either.left(evidencia.value)
    if (!evidencia.value) return Either.right(false)

    const deleted = await this.evidenciaCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      const { arquivo } = evidencia.value
      const removido = await this.evidenciaArquivo.remove(arquivo)

      // evidência já apagada do banco; sem log aqui, o arquivo órfão nunca seria detectável depois
      if (removido.left()) {
        this.logger.error('Falha ao remover arquivo órfão de evidência', {
          evidencia_id: id, arquivo, error: removido.value.message
        })
      }
    }

    return deleted
  }
}
