import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

import { EvidenciaArquivo } from './EvidenciaArquivo'
import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  evidenciaCollection: EvidenciaCollection
  evidenciaArquivo: EvidenciaArquivo
  logger: Logger
}

/**
 * Caso de uso responsável pela exclusão de evidências e desalocação do respectivo arquivo físico em disco.
 */
export class RemoveEvidenciaUseCase {
  private readonly evidenciaCollection: EvidenciaCollection
  private readonly evidenciaArquivo: EvidenciaArquivo
  private readonly logger: Logger

  /**
   * @param dependencies Repositório de evidências, manipulador de arquivos em disco e logger.
   */
  constructor(dependencies: Dependencies) {
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.evidenciaArquivo = dependencies.evidenciaArquivo
    this.logger = dependencies.logger
  }

  /**
   * Remove o registro da evidência no banco e expurga o arquivo em disco.
   *
   * @param params Objeto contendo o identificador da evidência.
   * @returns Either com booleano indicando se a evidência existia e foi removida ou erro de infraestrutura.
   */
  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencia = await this.evidenciaCollection.findById(id)
    if (evidencia.left()) return Either.left(evidencia.value)
    if (!evidencia.value) return Either.right(false)

    const deleted = await this.evidenciaCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      const { arquivo } = evidencia.value
      const removido = await this.evidenciaArquivo.remove(arquivo)

      // Evidência já apagada do banco; falhas na remoção do arquivo em disco são logadas para rastreamento de arquivos órfãos
      if (removido.left()) {
        this.logger.error('Falha ao remover arquivo órfão de evidência', {
          evidencia_id: id, arquivo, error: removido.value.message
        })
      }
    }

    return deleted
  }
}
