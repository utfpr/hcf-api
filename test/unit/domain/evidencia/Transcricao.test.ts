import {
  describe, expect, it, vi
} from 'vitest'

import { TranscricaoError } from '@/domain/evidencia/error/TranscricaoError'
import {
  TranscreveEvidencia, Transcricao, TranscricaoCollection
} from '@/domain/evidencia/Transcricao'
import { createRules } from '@/library/auth/createRules'

const evidence = {
  id: 1, arquivo: 'audio.m4a', mime_type: 'audio/mp4'
}
const completed: Transcricao = {
  evidencia_id: 1,
  status: 'concluida',
  texto_original: 'Árvore alta.',
  texto_revisado: 'Árvore muito alta.',
  versao: 2,
  gerado_por: 1,
  gerado_por_nome: 'Maria',
  gerado_em: new Date(),
  revisado_por: 1,
  revisado_por_nome: 'Maria',
  revisado_em: new Date(),
  codigo_erro: null,
  processamento_expira_em: null
}

function setup() {
  const collection: TranscricaoCollection = {
    find: vi.fn().mockResolvedValue(null),
    summaries: vi.fn(),
    claim: vi.fn().mockResolvedValue(true),
    complete: vi.fn().mockResolvedValue(true),
    fail: vi.fn(),
    revise: vi.fn()
  }
  const transcriber = { leaseMs: 120000, transcribe: vi.fn().mockResolvedValue('Árvore alta.') }
  const logger = {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()
  }
  const idGenerator = { generate: vi.fn().mockReturnValue('tentativa-1') }
  const service = new TranscreveEvidencia({
    collection, transcriber, idGenerator, logger
  })
  return {
    collection, transcriber, logger, service
  }
}

describe('Transcrição de evidência', () => {
  it('retorna resultado salvo sem chamar o serviço nem perder a revisão', async () => {
    const {
      collection, transcriber, service
    } = setup()
    vi.mocked(collection.find).mockResolvedValue(completed)
    expect(await service.execute(evidence, 1)).toEqual(completed)
    expect(transcriber.transcribe).not.toHaveBeenCalled()
    expect(collection.claim).not.toHaveBeenCalled()
  })

  it('reserva, transcreve e persiste antes de retornar', async () => {
    const {
      collection, transcriber, logger, service
    } = setup()
    vi.mocked(collection.find).mockResolvedValueOnce(null).mockResolvedValueOnce(completed)
    await service.execute(evidence, 1)
    expect(collection.claim).toHaveBeenCalledWith(1, expect.any(String), 1, 120000)
    expect(transcriber.transcribe).toHaveBeenCalledWith('audio.m4a', 'audio/mp4')
    expect(collection.complete).toHaveBeenCalledWith(1, expect.any(String), 'Árvore alta.')
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('Árvore')
  })

  it('não inicia uma segunda geração quando existe tentativa ativa', async () => {
    const {
      collection, transcriber, service
    } = setup()
    vi.mocked(collection.claim).mockResolvedValue(false)
    await expect(service.execute(evidence, 1)).rejects.toMatchObject({ code: 'transcricao_em_processamento', statusCode: 409 })
    expect(transcriber.transcribe).not.toHaveBeenCalled()
  })

  it('marca erro recuperável sem texto em caso de timeout', async () => {
    const {
      collection, transcriber, service
    } = setup()
    transcriber.transcribe.mockRejectedValue(new TranscricaoError(504, 'transcricao_timeout', 'Timeout'))
    await expect(service.execute(evidence, 1)).rejects.toMatchObject({ statusCode: 504 })
    expect(collection.fail).toHaveBeenCalledWith(1, expect.any(String), 'transcricao_timeout')
    expect(collection.complete).not.toHaveBeenCalled()
  })

  it('rejeita texto vazio e não aceita o resultado de uma tentativa vencida', async () => {
    const {
      collection, transcriber, service
    } = setup()
    transcriber.transcribe.mockResolvedValueOnce(' ')
    await expect(service.execute(evidence, 1)).rejects.toMatchObject({ code: 'resposta_invalida' })
    expect(collection.complete).not.toHaveBeenCalled()
    vi.mocked(collection.complete).mockResolvedValue(false)
    await expect(service.execute(evidence, 1)).rejects.toMatchObject({ code: 'tentativa_expirada' })
  })

  it('rejeita anexos de imagem antes de chamar o serviço', async () => {
    const { transcriber, service } = setup()
    await expect(service.execute({ ...evidence, mime_type: 'image/jpeg' }, 1)).rejects.toMatchObject({ statusCode: 415 })
    expect(transcriber.transcribe).not.toHaveBeenCalled()
  })

  it('concede update Evidencia somente a curador e operador', () => {
    for (const tipo of [
      1,
      2,
      3
    ]) {
      expect(createRules({ id: 1, tipo_usuario_id: tipo }).some(rule => rule.action === 'update' && rule.resource === 'Evidencia')).toBe(tipo !== 3)
    }
  })
})
