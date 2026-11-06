import axios from 'axios'
import {
  mkdtemp, rm, writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  afterEach, beforeEach, describe, expect, it, vi
} from 'vitest'

import { SpeechToTextAdapter } from '@/infrastructure/SpeechToTextAdapter'

vi.mock('axios', () => ({ default: { post: vi.fn(), isAxiosError: (value: unknown) => Boolean(value && typeof value === 'object' && 'isAxiosError' in value) } }))
let directory: string
const config = {
  url: 'http://gateway:23000/', clientId: 'hcf-api', apiKey: 'test-only', timeoutMs: 75000, maxUploadMb: 25
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'hcf-stt-'))
  await writeFile(join(directory, 'audio.m4a'), 'audio original')
})
afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('SpeechToTextAdapter', () => {
  it('envia bytes do arquivo armazenado, MIME e autenticação em multipart', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { text: '  Árvore alta.  ' } })
    const adapter = new SpeechToTextAdapter(config, directory)
    expect(await adapter.transcribe('audio.m4a', 'audio/mp4')).toBe('Árvore alta.')
    const [
      url,
      form,
      options
    ] = vi.mocked(axios.post).mock.calls[0]
    expect(url).toBe('http://gateway:23000/v1/transcriptions')
    expect(options?.headers).toEqual({ 'x-client-id': 'hcf-api', 'x-api-key': 'test-only' })
    const file = (form as FormData).get('file') as File
    expect(file.type).toBe('audio/mp4')
    expect(await file.text()).toBe('audio original')
  })

  it('não chama a rede para arquivo ausente, caminho inválido ou tamanho excedido', async () => {
    const adapter = new SpeechToTextAdapter({ ...config, maxUploadMb: 0.000001 }, directory)
    await expect(adapter.transcribe('audio.m4a', 'audio/mp4')).rejects.toMatchObject({ statusCode: 413 })
    await expect(adapter.transcribe('../audio.m4a', 'audio/mp4')).rejects.toMatchObject({ statusCode: 409 })
    await expect(adapter.transcribe('ausente.m4a', 'audio/mp4')).rejects.toMatchObject({ statusCode: 409 })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('retorna indisponibilidade controlada sem configuração', async () => {
    await expect(new SpeechToTextAdapter({ ...config, apiKey: undefined }, directory).transcribe('audio.m4a', 'audio/mp4')).rejects.toMatchObject({ statusCode: 503 })
  })

  it('distingue timeout e resposta sem texto', async () => {
    const adapter = new SpeechToTextAdapter(config, directory)
    vi.mocked(axios.post).mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' })
    await expect(adapter.transcribe('audio.m4a', 'audio/mp4')).rejects.toMatchObject({ statusCode: 504 })
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { text: '' } })
    await expect(adapter.transcribe('audio.m4a', 'audio/mp4')).rejects.toMatchObject({ code: 'resposta_invalida' })
  })
})
