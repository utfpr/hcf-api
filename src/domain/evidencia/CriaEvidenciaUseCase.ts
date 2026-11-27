import { EventoNaoEncontradoError } from '@/domain/evento/error/EventoNaoEncontradoError'
import { EventoCollection } from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'
import { Logger } from '@/library/logger/Logger'

import {
  Attributes, CreateAttributes, Evidencia
} from './Evidencia'
import { EvidenciaArquivo } from './EvidenciaArquivo'
import { EvidenciaCollection } from './EvidenciaCollection'

interface Dependencies {
  eventoCollection: EventoCollection
  evidenciaCollection: EvidenciaCollection
  evidenciaArquivo: EvidenciaArquivo
  logger: Logger
}

/**
 * Parâmetros de entrada para criação de uma nova evidência.
 */
export interface Input {
  evento_id: number
  nome: string
  data_captura: Date
  mime_type: string
  contents: Buffer
  created_by: number | null
  client_uuid?: string
}

/**
 * Persiste os metadados da evidência no banco e salva o arquivo em disco.
 * Caso a gravação no banco falhe após o upload, remove o arquivo órfão do disco.
 */
export class CriaEvidenciaUseCase {
  private readonly eventoCollection: EventoCollection
  private readonly evidenciaCollection: EvidenciaCollection
  private readonly evidenciaArquivo: EvidenciaArquivo
  private readonly logger: Logger

  /**
   * @param dependencies Repositórios de evento e evidência, port de arquivo e logger.
   */
  constructor(dependencies: Dependencies) {
    this.eventoCollection = dependencies.eventoCollection
    this.evidenciaCollection = dependencies.evidenciaCollection
    this.evidenciaArquivo = dependencies.evidenciaArquivo
    this.logger = dependencies.logger
  }

  /**
   * Persiste os metadados da evidência no banco e salva o arquivo em disco.
   * Caso a gravação no banco falhe após o upload, remove o arquivo órfão do disco.
   *
   * @param input Dados do arquivo recebido via Multer e ID do evento associado.
   * @returns Either com a entidade Evidencia criada ou erro de infraestrutura/validação.
   */
  async execute(input: Input): Promise<Either<Error, Attributes>> {
    const evento = await this.eventoCollection.findById(input.evento_id)
    if (evento.left()) return Either.left(evento.value)
    if (!evento.value) return Either.left(new EventoNaoEncontradoError())

    // Idempotência offline: caso o app móvel reenvie a evidência após falha de rede, devolve o registro existente sem regravar o arquivo em disco
    if (input.client_uuid) {
      const existente = await this.evidenciaCollection.findByClientUuid(input.client_uuid)
      if (existente.left()) return Either.left(existente.value)
      if (existente.value) return Either.right(existente.value)
    }

    const salvo = await this.evidenciaArquivo.save({
      expedicaoId: evento.value.expedicao_id,
      eventoId: input.evento_id,
      mimeType: input.mime_type,
      contents: input.contents
    })
    if (salvo.left()) return Either.left(salvo.value)

    const attributes: CreateAttributes = {
      evento_id: input.evento_id,
      nome: input.nome,
      arquivo: salvo.value.arquivo,
      mime_type: input.mime_type,
      tamanho: salvo.value.tamanho,
      data_captura: input.data_captura,
      created_by: input.created_by,
      ...(input.client_uuid ? { client_uuid: input.client_uuid } : {})
    }

    const validated = Evidencia.create(attributes)
    if (validated.left()) {
      // Caso a validação de domínio falhe, descarta imediatamente o arquivo gravado em disco
      await this.descartaArquivo(attributes.arquivo)
      return Either.left(validated.value)
    }

    const created = await this.evidenciaCollection.create(attributes)
    if (created.left()) {
      // Caso a gravação no banco falhe após o upload, remove o arquivo órfão do disco
      await this.descartaArquivo(attributes.arquivo)
    }

    return created
  }

  private async descartaArquivo(arquivo: string): Promise<void> {
    const removido = await this.evidenciaArquivo.remove(arquivo)
    if (removido.left()) {
      this.logger.error('Falha ao descartar arquivo de evidência não persistida', { arquivo, error: removido.value.message })
    }
  }
}
