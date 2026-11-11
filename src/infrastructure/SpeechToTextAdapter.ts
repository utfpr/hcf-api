import axios from 'axios'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { EVIDENCIA_DIR } from '@/config/evidencia'
import { TranscricaoError } from '@/domain/evidencia/error/TranscricaoError'
import { AudioTranscriber } from '@/domain/evidencia/Transcricao'

interface Configuration {
  url?: string
  clientId?: string
  apiKey?: string
  timeoutMs: number
  maxUploadMb: number
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export class SpeechToTextAdapter implements AudioTranscriber {
  readonly leaseMs: number

  constructor(private readonly config: Configuration = {
    url: process.env.SPEECH_TO_TEXT_URL,
    clientId: process.env.SPEECH_TO_TEXT_CLIENT_ID,
    apiKey: process.env.SPEECH_TO_TEXT_API_KEY,
    timeoutMs: positiveNumber(process.env.SPEECH_TO_TEXT_TIMEOUT_MS, 75000),
    maxUploadMb: positiveNumber(process.env.SPEECH_TO_TEXT_MAX_UPLOAD_MB, 25)
  }, private readonly directory = EVIDENCIA_DIR) {
    this.leaseMs = Math.max(120000, config.timeoutMs + 30000)
  }

  async transcribe(arquivo: string, mimeType: string): Promise<string> {
    const {
      url, clientId, apiKey, timeoutMs, maxUploadMb
    } = this.config
    if (!url || !clientId || !apiKey) {
      throw new TranscricaoError(503, 'servico_nao_configurado', 'O serviço de transcrição não está configurado.')
    }
    if (path.basename(arquivo) !== arquivo || arquivo === '.' || arquivo === '..') {
      throw new TranscricaoError(409, 'arquivo_indisponivel', 'O arquivo desta evidência não está disponível.')
    }
    const filePath = path.join(this.directory, arquivo)
    let buffer: Buffer
    try {
      const info = await stat(filePath)
      if (!info.isFile()) throw new TranscricaoError(409, 'arquivo_indisponivel', 'O arquivo desta evidência não está disponível.')
      this.validateSize(info.size)
      buffer = await readFile(filePath)
      this.validateSize(buffer.length)
    } catch (error) {
      if (error instanceof TranscricaoError) throw error
      throw new TranscricaoError(409, 'arquivo_indisponivel', 'Não foi possível ler o arquivo desta evidência.')
    }
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), arquivo)
    try {
      const response = await axios.post<{ text?: unknown }>(`${url.replace(/\/$/, '')}/v1/transcriptions`, form, {
        timeout: timeoutMs,
        maxBodyLength: maxUploadMb * 1024 * 1024 + 65536,
        headers: { 'x-client-id': clientId, 'x-api-key': apiKey }
      })
      const text: unknown = response.data?.text
      if (typeof text !== 'string' || !text.trim()) {
        throw new TranscricaoError(502, 'resposta_invalida', 'O serviço não reconheceu texto neste áudio.')
      }
      return text.trim()
    } catch (error) {
      if (error instanceof TranscricaoError) throw error
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
        throw new TranscricaoError(504, 'transcricao_timeout', 'O tempo de transcrição foi excedido. Tente novamente.')
      }
      if (axios.isAxiosError(error) && error.response?.status === 413) {
        throw new TranscricaoError(413, 'audio_muito_grande', 'O áudio excede o limite do serviço de transcrição.')
      }
      throw new TranscricaoError(502, 'servico_indisponivel', 'Não foi possível transcrever o áudio. Tente novamente.')
    }
  }

  private validateSize(size: number): void {
    if (size > this.config.maxUploadMb * 1024 * 1024) {
      throw new TranscricaoError(413, 'audio_muito_grande', `O áudio excede o limite de ${this.config.maxUploadMb} MB para transcrição.`)
    }
  }
}
