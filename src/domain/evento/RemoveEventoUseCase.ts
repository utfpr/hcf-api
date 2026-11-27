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

/**
 * Caso de uso para remoção de evento e limpeza de suas evidências físicas (arquivos em disco).
 * Garante que a exclusão do registro no banco seja sucedida pela remoção segura dos arquivos de mídia.
 */
export class RemoveEventoUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly evidenciaCollection: EvidenciaCollection
  private readonly evidenciaArquivo: EvidenciaArquivo
  private readonly logger: Logger

  /**
   * @param dependencies Repositórios de evento e evidência, adaptador de arquivos em disco e logger.
   */
  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.evidenciaArquivo = dependencies.evidenciaArquivo
    this.logger = dependencies.logger
  }

  /**
   * Remove o evento no banco de dados e apaga os arquivos de evidência associados do disco.
   *
   * @param params Objeto contendo o ID numérico do evento.
   * @returns Either com booleano indicando se o evento foi excluído ou erro de persistência.
   */
  async execute({ id }: { id: number }): Promise<Either<Error, boolean>> {
    const evidencias = await this.evidenciaCollection.findAll({ evento_id: id })
    if (evidencias.left()) return Either.left(evidencias.value)

    const deleted = await this.eventoCollection.delete(id)
    if (deleted.left()) return Either.left(deleted.value)

    if (deleted.value) {
      await Promise.all(evidencias.value.map(async ({ arquivo }) => {
        const removido = await this.evidenciaArquivo.remove(arquivo)

        // Evento já apagado do banco; falhas na remoção do disco são registradas em log para permitir detecção e expurgo de arquivos órfãos
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
