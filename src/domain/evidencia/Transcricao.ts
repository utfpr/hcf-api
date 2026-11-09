import { TranscricaoError } from '@/domain/evidencia/error/TranscricaoError'
import { Logger } from '@/library/logger/Logger'

export type TranscricaoStatus = 'processando' | 'concluida' | 'erro'

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

export interface TranscricaoCollection {
  find(id: number): Promise<Transcricao | null>
  summaries(ids: number[]): Promise<Map<number, Pick<Transcricao, 'status' | 'versao'>>>
  claim(id: number, tentativa: string, usuarioId: number, leaseMs: number): Promise<boolean>
  complete(id: number, tentativa: string, texto: string): Promise<boolean>
  fail(id: number, tentativa: string, codigo: string): Promise<void>
  revise(id: number, versao: number, texto: string, usuarioId: number): Promise<boolean>
}

export interface AudioTranscriber {
  readonly leaseMs: number
  transcribe(arquivo: string, mimeType: string): Promise<string>
}

export interface IdGenerator {
  generate(): string
}

export class TranscreveEvidencia {
  constructor(private readonly dependencies: {
    collection: TranscricaoCollection
    transcriber: AudioTranscriber
    idGenerator: IdGenerator
    logger: Logger
  }) {}

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
