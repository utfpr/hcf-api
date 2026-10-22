import { existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'

interface EvidenciaBody {
  id: number
  arquivo: string
  mime_type: string
  url: string
}

async function deleteArquivo(arquivo: string): Promise<void> {
  const path = resolve('uploads', 'lembretes', arquivo)
  if (existsSync(path)) {
    await unlink(path)
  }
}

describe('Multimídia do lembrete (upload, HTTP)', () => {
  const { agent, knex } = createTestApp()
  let authHeader: { Authorization: string }
  let cleanupAuth: () => Promise<void>
  let lembreteId: number

  beforeAll(async () => {
    const auth = await createCuradorAuth(knex)
    authHeader = auth.header
    cleanupAuth = auth.cleanup

    const [lembrete] = await knex('lembretes')
      .insert({ data_coleta: '2026-11-20', local_coleta: 'XLEV upload http' })
      .returning<Array<{ id: number }>>(['id'])
    lembreteId = lembrete.id
  })

  afterAll(async () => {
    await knex('lembretes_evidencias').where({ lembrete_id: lembreteId }).delete()
    await knex('lembretes').where({ id: lembreteId }).delete()
    await cleanupAuth()
    await knex.destroy()
  })

  test('POST grava a foto em uploads/lembretes', async () => {
    const response = await agent
      .post(`/api/v1/lembretes/${lembreteId}/evidencias`)
      .set(authHeader)
      .field('nome', 'IMG_0042.jpg')
      .field('data_captura', '2026-11-20T14:32:00Z')
      .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
      .expect(201)

    const body = response.body as EvidenciaBody

    try {
      expect(body.mime_type).toBe('image/jpeg')
      expect(body.arquivo).toMatch(new RegExp(`^lembrete_${lembreteId}_\\d+-[0-9a-f]{4}\\.jpg$`))
      expect(existsSync(resolve('uploads', 'lembretes', body.arquivo))).toBe(true)
    } finally {
      await deleteArquivo(body.arquivo)
    }
  })

  test.each([
    ['video/mp4', 'video.mp4'],
    ['audio/mpeg', 'audio.mp3'],
    ['application/pdf', 'doc.pdf']
  ])('POST rejeita %s, pois o lembrete só aceita fotos', async (contentType, filename) => {
    await agent
      .post(`/api/v1/lembretes/${lembreteId}/evidencias`)
      .set(authHeader)
      .field('nome', filename)
      .field('data_captura', '2026-11-20T14:32:00Z')
      .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType, filename })
      .expect(400)
  })
})
