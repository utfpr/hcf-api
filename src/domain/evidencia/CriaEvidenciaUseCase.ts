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

export interface Input {
  evento_id: number
  nome: string
  data_captura: Date
  mime_type: string
  contents: Buffer
  created_by: number | null
}

export class CriaEvidenciaUseCase {
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

  async execute(input: Input): Promise<Either<Error, Attributes>> {
    const evento = await this.eventoCollection.findById(input.evento_id)
    if (evento.left()) return Either.left(evento.value)
    if (!evento.value) return Either.left(new EventoNaoEncontradoError())

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
      created_by: input.created_by
    }

    const validated = Evidencia.create(attributes)
    if (validated.left()) {
      await this.descartaArquivo(attributes.arquivo)
      return Either.left(validated.value)
    }

    const created = await this.evidenciaCollection.create(attributes)
    if (created.left()) {
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
