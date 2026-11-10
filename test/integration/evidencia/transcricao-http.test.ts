import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import {
  afterAll, beforeAll, beforeEach, describe, expect, test, vi, type MockInstance
} from 'vitest'

import { Transcricao } from '@/domain/evidencia/Transcricao'
import { SpeechToTextAdapter } from '@/infrastructure/SpeechToTextAdapter'
import { TranscricaoCollectionKnexAdapter } from '@/infrastructure/TranscricaoCollectionKnexAdapter'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth } from '../setup/curador-auth'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

// Only the recognition engine is replaced; HTTP auth, persistence and leases use the real database.
describe('Transcrição de evidência (HTTP e banco)', () => {
  const { agent, knex } = createTestApp()
  const repository = new TranscricaoCollectionKnexAdapter(knex)
  let auth: Awaited<ReturnType<typeof createCuradorAuth>>
  let leitorHeader: { Authorization: string }
  let fixtures: ExpedicaoFixtures
  let expedicaoId: number
  let eventoId: number
  let evidenciaId: number
  let imagemId: number
  let transcribe: MockInstance<SpeechToTextAdapter['transcribe']>

  beforeAll(async () => {
    auth = await createCuradorAuth(knex)
    fixtures = await seedExpedicaoFixtures(knex)
    leitorHeader = { Authorization: `Bearer ${jwt.sign({ id: fixtures.usuarios[0], tipo_usuario_id: fixtures.tipoUsuarioId }, process.env.JWT_SECRET as string)}` }
    const [expedicao] = await knex('expedicoes').insert({
      cidade_id: fixtures.cidades[0], data_inicio: '2026-11-01', data_fim: '2026-11-02', descricao: 'Transcrição HTTP'
    }).returning<Array<{ id: number }>>(['id'])
    expedicaoId = expedicao.id
    const [evento] = await knex('eventos').insert({
      expedicao_id: expedicaoId, tipo: 'DIARIO', data_captura: new Date()
    }).returning<Array<{ id: number }>>(['id'])
    eventoId = evento.id
    const rows = await knex('evidencias').insert([
      {
        evento_id: eventoId, nome: 'Áudio', arquivo: 'teste.m4a', mime_type: 'audio/mp4', tamanho: 10, data_captura: new Date()
      },
      {
        evento_id: eventoId, nome: 'Foto', arquivo: 'teste.jpg', mime_type: 'image/jpeg', tamanho: 10, data_captura: new Date()
      }
    ]).returning<Array<{ id: number }>>(['id'])
    evidenciaId = rows[0].id
    imagemId = rows[1].id
    transcribe = vi.spyOn(SpeechToTextAdapter.prototype, 'transcribe')
  })
  beforeEach(async () => {
    await knex('evidencias_transcricoes').whereIn('evidencia_id', [evidenciaId, imagemId]).delete()
    transcribe.mockReset().mockResolvedValue('Árvore de flores amarelas.')
  })
  afterAll(async () => {
    transcribe?.mockRestore()
    await knex('eventos').where({ id: eventoId }).delete()
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await auth.cleanup()
    await knex.destroy()
  })

  const url = () => `/api/v1/evidencias/${evidenciaId}/transcricao`

  test('autoriza leitores para consultar e impede que gerem ou revisem', async () => {
    await agent.post(url()).expect(401)
    await agent.get(url()).set(leitorHeader).expect(200, null)
    await agent.post(url()).set(leitorHeader).expect(403)
    await agent.patch(url()).set(leitorHeader).send({ texto_revisado: 'Outro', versao: 1 }).expect(403)
    expect(transcribe).not.toHaveBeenCalled()
  })

  test('gera, lista resumo, corrige e mantém original e versão depois de consultar', async () => {
    const generated = await agent.post(url()).set(auth.header).expect(200)
    expect((generated.body as Transcricao).texto_original).toBe('Árvore de flores amarelas.')
    expect((generated.body as Transcricao).gerado_por).toBe(auth.usuarioId)
    const listed = await agent.get(`/api/v1/eventos/${eventoId}/evidencias`).set(auth.header).expect(200)
    expect((listed.body as Array<{ id: number; transcricao: { status: string; versao: number } }>).find(e => e.id === evidenciaId)?.transcricao).toEqual({ status: 'concluida', versao: 1 })
    await agent.patch(url()).set(auth.header).send({ texto_revisado: 'Árvore com flores amarelas.', versao: 1 }).expect(200)
    const current = await agent.get(url()).set(auth.header).expect(200)
    expect(current.body).toMatchObject({
      texto_original: 'Árvore de flores amarelas.', texto_revisado: 'Árvore com flores amarelas.', versao: 2, revisado_por: auth.usuarioId
    })
    await agent.patch(url()).set(auth.header).send({ texto_revisado: 'Versão antiga', versao: 1 }).expect(409)
    const cached = await agent.post(url()).set(auth.header).expect(200)
    expect((cached.body as Transcricao).texto_revisado).toBe('Árvore com flores amarelas.')
    expect(transcribe).toHaveBeenCalledTimes(1)
  })

  test('rejeita imagem, ID inválido e evidência inexistente', async () => {
    await agent.post(`/api/v1/evidencias/${imagemId}/transcricao`).set(auth.header).expect(415)
    await agent.post('/api/v1/evidencias/abc/transcricao').set(auth.header).expect(400)
    await agent.post('/api/v1/evidencias/999999999/transcricao').set(auth.header).expect(404)
  })

  test('reserva uma única tentativa, recupera reserva vencida e descarta resultado antigo', async () => {
    const first = randomUUID()
    const second = randomUUID()
    const results = await Promise.all([
      repository.claim(evidenciaId, first, auth.usuarioId, 120000),
      repository.claim(evidenciaId, second, auth.usuarioId, 120000)
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
    await agent.post(url()).set(auth.header).expect(409)
    await knex('evidencias_transcricoes').where({ evidencia_id: evidenciaId }).update({ processamento_expira_em: new Date(Date.now() - 1000) })
    const fresh = randomUUID()
    expect(await repository.claim(evidenciaId, fresh, auth.usuarioId, 120000)).toBe(true)
    expect(await repository.complete(evidenciaId, results[0] ? first : second, 'Antigo')).toBe(false)
    expect(await repository.complete(evidenciaId, fresh, 'Novo')).toBe(true)
    expect((await repository.find(evidenciaId))?.texto_original).toBe('Novo')
  })

  test('excluir a evidência elimina sua transcrição em cascata', async () => {
    const [extra] = await knex('evidencias').insert({
      evento_id: eventoId, nome: 'Extra', arquivo: 'extra.m4a', mime_type: 'audio/mp4', tamanho: 1, data_captura: new Date()
    }).returning<Array<{ id: number }>>(['id'])
    await repository.claim(extra.id, randomUUID(), auth.usuarioId, 120000)
    await knex('evidencias').where({ id: extra.id }).delete()
    expect(await repository.find(extra.id)).toBeNull()
  })
})
