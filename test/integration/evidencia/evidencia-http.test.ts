import { existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

interface EvidenciaBody {
  id: number
  arquivo: string
  mime_type: string
  tamanho: number
  url: string
}

function asEvidencia(body: unknown): EvidenciaBody {
  return body as EvidenciaBody
}

async function deleteArquivo(arquivo: string): Promise<void> {
  const path = resolve('uploads', 'evidencias', arquivo)
  if (existsSync(path)) {
    await unlink(path)
  }
}

describe('Evidências (upload, HTTP)', () => {
  const { agent, knex } = createTestApp()

  let fixtures: ExpedicaoFixtures
  let expedicaoId: number
  let eventoId: number

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    const [expedicao] = await knex('expedicoes')
      .insert({
        cidade_id: fixtures.cidades[0], data_fim: '2026-02-18', data_inicio: '2026-02-14', descricao: 'XEVD evidências http'
      })
      .returning<Array<{ id: number }>>(['id'])
    expedicaoId = expedicao.id

    const [evento] = await knex('eventos')
      .insert({
        expedicao_id: expedicaoId, tipo: 'DIARIO', capturado_em: new Date('2026-02-15T13:15:00.000Z')
      })
      .returning<Array<{ id: number }>>(['id'])
    eventoId = evento.id
  })

  afterAll(async () => {
    await knex('eventos').where({ id: eventoId }).delete()
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  test('POST grava o arquivo em disco e a evidência no banco', async () => {
    const response = await agent
      .post(`/api/v2/eventos/${eventoId}/evidencias`)
      .field('nome', 'IMG_0042.jpg')
      .field('capturado_em', '2026-02-15T14:32:00Z')
      .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
      .expect(201)

    const body = asEvidencia(response.body)

    try {
      expect(body.mime_type).toBe('image/jpeg')
      expect(body.tamanho).toBeGreaterThan(0)
      expect(body.arquivo).toMatch(new RegExp(`^${expedicaoId}_${eventoId}_\\d+-[0-9a-f]{4}\\.jpg$`))
      expect(body.url).toBe(`/uploads/evidencias/${body.arquivo}`)
      expect(existsSync(resolve('uploads', 'evidencias', body.arquivo))).toBe(true)
    } finally {
      await knex('evidencias').where({ id: body.id }).delete()
      await deleteArquivo(body.arquivo)
    }
  })

  test('POST rejeita tipo de arquivo não suportado', async () => {
    await agent
      .post(`/api/v2/eventos/${eventoId}/evidencias`)
      .field('nome', 'anotacoes.txt')
      .field('capturado_em', '2026-02-15T14:32:00Z')
      .attach('arquivo', Buffer.from('texto qualquer'), { contentType: 'text/plain', filename: 'anotacoes.txt' })
      .expect(400)
  })

  test('POST retorna 404 quando o evento não existe', async () => {
    await agent
      .post('/api/v2/eventos/999999999/evidencias')
      .field('nome', 'IMG_0042.jpg')
      .field('capturado_em', '2026-02-15T14:32:00Z')
      .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
      .expect(404)
  })

  test('GET lista as evidências do evento com a url computada', async () => {
    const created = await agent
      .post(`/api/v2/eventos/${eventoId}/evidencias`)
      .field('nome', 'audio.mp3')
      .field('capturado_em', '2026-02-15T14:32:00Z')
      .attach('arquivo', Buffer.from('audio de teste'), { contentType: 'audio/mpeg', filename: 'audio.mp3' })
      .expect(201)

    const createdBody = asEvidencia(created.body)

    try {
      const response = await agent.get(`/api/v2/eventos/${eventoId}/evidencias`).expect(200)
      const [evidencia] = response.body as EvidenciaBody[]

      expect(evidencia).toMatchObject({ id: createdBody.id, url: createdBody.url })
    } finally {
      await knex('evidencias').where({ id: createdBody.id }).delete()
      await deleteArquivo(createdBody.arquivo)
    }
  })
})
