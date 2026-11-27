import { TranscricaoError } from '@/domain/evidencia/error/TranscricaoError'
import { Logger } from '@/library/logger/Logger'

export type TranscricaoStatus = 'processando' | 'concluida' | 'erro'

/**
 * Representação da entidade de transcrição de áudio com histórico de revisão e controle de versão.
 */
export interface Transcricao {
  evidencia_id: number
  status: TranscricaoStatus
  texto_original: string | null
  texto_revisado: string | null
  versao: number
  gerado_por: number | null
  gerado_por_nome: string | null
  gerado_em: Date | null
  revisado_por: number | null
  revisado_por_nome: string | null
  revisado_em: Date | null
  codigo_erro: string | null
  processamento_expira_em: Date | null
}

/**
 * Contrato de repositório para persistência, concorrência (lease/claim) e revisão de transcrições.
 */
export interface TranscricaoCollection {
  find(id: number): Promise<Transcricao | null>
  summaries(ids: number[]): Promise<Map<number, Pick<Transcricao, 'status' | 'versao'>>>
  claim(id: number, tentativa: string, usuarioId: number, leaseMs: number): Promise<boolean>
  complete(id: number, tentativa: string, texto: string): Promise<boolean>
  fail(id: number, tentativa: string, codigo: string): Promise<void>
  revise(id: number, versao: number, texto: string, usuarioId: number): Promise<boolean>
}

/**
 * Serviço de transcrição de áudio via Speech-to-Text.
 */
export interface AudioTranscriber {
  readonly leaseMs: number
  transcribe(arquivo: string, mimeType: string): Promise<string>
}

/**
 * Gerador de identificadores únicos para tentativas de processamento de áudio.
 */
export interface IdGenerator {
  generate(): string
}

/**
 * Caso de uso para orquestração de transcrição assíncrona de evidências de áudio.
 * Implementa controle de concorrência com lease para evitar reprocessamentos duplicados.
 */
export class TranscreveEvidencia {
  /**
   * @param dependencies Coleção de transcrições, transcritor de áudio, gerador de IDs e logger.
   */
  constructor(private readonly dependencies: {
    collection: TranscricaoCollection
    transcriber: AudioTranscriber
    idGenerator: IdGenerator
    logger: Logger
  }) {}

  /**
   * Inicia ou recupera a transcrição de uma evidência de áudio.
   *
   * @param evidencia Dados da evidência contendo id, nome do arquivo e tipo MIME de áudio.
   * @param usuarioId ID do usuário que solicitou a transcrição.
   * @returns Entidade Transcricao com o texto reconhecido ou status atualizado.
   * @throws TranscricaoError em caso de formato incompatível (415), conflito de concorrência (409) ou falha no transcritor.
   */
  async execute(evidencia: { id: number; arquivo: string; mime_type: string }, usuarioId: number): Promise<Transcricao> {
    const {
      collection, transcriber, idGenerator, logger
    } = this.dependencies
    if (!evidencia.mime_type.startsWith('audio/')) {
      throw new TranscricaoError(415, 'formato_incompativel', 'Apenas evidências de áudio podem ser transcritas.')
    }
    const existente = await collection.find(evidencia.id)
    if (existente?.status === 'concluida') return existente
    const tentativa = idGenerator.generate()
    const startedAt = Date.now()
    // Mecanismo de lock distribuído temporizado (lease/claim) para prevenir processamento concorrente do mesmo áudio
    const claimed = await collection.claim(evidencia.id, tentativa, usuarioId, transcriber.leaseMs)
    if (!claimed) {
      const atual = await collection.find(evidencia.id)
      if (atual?.status === 'concluida') return atual
      throw new TranscricaoError(409, 'transcricao_em_processamento', 'Este áudio já está sendo transcrito. Aguarde.')
    }
    try {
      const texto = await transcriber.transcribe(evidencia.arquivo, evidencia.mime_type)
      if (!texto.trim()) throw new TranscricaoError(502, 'resposta_invalida', 'O serviço não reconheceu texto neste áudio.')
      if (!await collection.complete(evidencia.id, tentativa, texto)) {
        throw new TranscricaoError(409, 'tentativa_expirada', 'A tentativa expirou ou a evidência foi removida. Recarregue a transcrição.')
      }
      const result = await collection.find(evidencia.id)
      if (!result) throw new TranscricaoError(404, 'evidencia_nao_encontrada', 'Evidência não encontrada.')
      logger.info('Transcrição concluída', {
        evidenciaId: evidencia.id, tentativa, durationMs: Date.now() - startedAt
      })
      return result
    } catch (error) {
      const codigo = error instanceof TranscricaoError ? error.code : 'falha_interna'
      await collection.fail(evidencia.id, tentativa, codigo)
      logger.warn('Falha na transcrição', {
        evidenciaId: evidencia.id, tentativa, codigo, durationMs: Date.now() - startedAt
      })
      throw error
    }
  }
}
