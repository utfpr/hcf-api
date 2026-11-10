import { existsSync, readdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth, createExpedicionarioAuth } from '../setup/curador-auth'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

type Header = { Authorization: string }

const diario = {
  data_captura: '2026-02-15T14:32:00Z', latitude: -20.25, longitude: -46.41, observacoes: 'x', tipo: 'DIARIO'
}
const lembrete = { data_coleta: '2026-11-20', local_coleta: 'XEXP local' }
const NAO_PARTICIPA = 'Você não participa desta expedição'

function mensagem(body: unknown): string | undefined {
  return (body as { error?: { message?: string } }).error?.message
}

describe('Expedicionário (autorização de escrita, HTTP)', () => {
  const { agent, knex } = createTestApp()

  let expedicionario: Header
  let expedicionarioId: number
  let curador: Header
  let curadorId: number
  const cleanups: Array<() => Promise<void>> = []

  let fixtures: ExpedicaoFixtures
  /** Expedição em que o expedicionário participa. */
  let expA: number
  /** Expedição em que ele não participa. */
  let expB: number

  const arquivosLembrete: string[] = []

  async function criaEvento(expedicaoId: number, createdBy: number | null): Promise<number> {
    const [row] = await knex('eventos')
      .insert({
        expedicao_id: expedicaoId, tipo: 'DIARIO', data_captura: '2026-02-15T14:32:00Z', created_by: createdBy
      })
      .returning<Array<{ id: number }>>(['id'])
    return row.id
  }

  async function criaEvidencia(eventoId: number, createdBy: number | null): Promise<number> {
    const [row] = await knex('evidencias')
      .insert({
        evento_id: eventoId,
        nome: 'x.jpg',
        arquivo: 'xexp-inexistente.jpg',
        mime_type: 'image/jpeg',
        tamanho: 1,
        data_captura: '2026-02-15T14:32:00Z',
        created_by: createdBy
      })
      .returning<Array<{ id: number }>>(['id'])
    return row.id
  }

  async function criaLembrete(expedicaoId: number | null, createdBy: number | null): Promise<number> {
    const [row] = await knex('lembretes')
      .insert({
        ...lembrete, expedicao_id: expedicaoId, created_by: createdBy
      })
      .returning<Array<{ id: number }>>(['id'])
    return row.id
  }

  async function criaLembreteEvidencia(lembreteId: number, createdBy: number | null): Promise<number> {
    const [row] = await knex('lembretes_evidencias')
      .insert({
        lembrete_id: lembreteId,
        nome: 'x.jpg',
        arquivo: 'xexp-inexistente.jpg',
        mime_type: 'image/jpeg',
        tamanho: 1,
        data_captura: '2026-02-15T14:32:00Z',
        created_by: createdBy
      })
      .returning<Array<{ id: number }>>(['id'])
    return row.id
  }

  function enviaFotoLembrete(lembreteId: number, header: Header) {
    return agent
      .post(`/api/v1/lembretes/${lembreteId}/evidencias`)
      .set(header)
      .field('nome', 'IMG_0042.jpg')
      .field('data_captura', '2026-11-20T14:32:00Z')
      .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
  }

  beforeAll(async () => {
    const exp = await createExpedicionarioAuth(knex)
    expedicionario = exp.header
    expedicionarioId = exp.usuarioId
    cleanups.push(exp.cleanup)

    const cur = await createCuradorAuth(knex)
    curador = cur.header
    curadorId = cur.usuarioId
    cleanups.push(cur.cleanup)

    fixtures = await seedExpedicaoFixtures(knex)
    const expedicoes = await knex('expedicoes')
      .insert([
        {
          cidade_id: fixtures.cidades[0], data_inicio: '2026-02-14', data_fim: '2026-02-18', descricao: 'XEXP A'
        },
        {
          cidade_id: fixtures.cidades[0], data_inicio: '2026-02-14', data_fim: '2026-02-18', descricao: 'XEXP B'
        }
      ])
      .returning<Array<{ id: number }>>(['id'])
    expA = expedicoes[0].id
    expB = expedicoes[1].id

    await knex('expedicoes_participantes').insert({ expedicao_id: expA, usuario_id: expedicionarioId })
  })

  afterAll(async () => {
    await Promise.all(arquivosLembrete.map(async arquivo => {
      const path = resolve('uploads', 'lembretes', arquivo)
      if (existsSync(path)) await unlink(path)
    }))
    await knex('lembretes').whereIn('created_by', [expedicionarioId, curadorId]).delete()
    await knex('lembretes').whereIn('expedicao_id', [expA, expB]).delete()
    await knex('expedicoes').whereIn('id', [expA, expB]).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    for (const cleanup of cleanups) await cleanup()
    await knex.destroy()
  })

  describe('expedição', () => {
    test('não cria, edita nem exclui expedição', async () => {
      await agent.post('/api/v1/expedicoes').set(expedicionario).send({}).expect(403)
      await agent.put(`/api/v1/expedicoes/${expA}`).set(expedicionario).send({}).expect(403)
      await agent.delete(`/api/v1/expedicoes/${expA}`).set(expedicionario).expect(403)
      await agent.post(`/api/v1/expedicoes/${expA}/participantes`).set(expedicionario).send({}).expect(403)
      await agent.put(`/api/v1/expedicoes/${expA}/rotas`).set(expedicionario).send({}).expect(403)
    })

    test('lê expedições de que não participa', async () => {
      await agent.get(`/api/v1/expedicoes/${expB}`).set(expedicionario).expect(200)
      await agent.get(`/api/v1/expedicoes/${expB}/eventos`).set(expedicionario).expect(200)
    })
  })

  describe('eventos', () => {
    test('cria evento na expedição em que participa', async () => {
      await agent.post(`/api/v1/expedicoes/${expA}/eventos`).set(expedicionario).send(diario).expect(201)
    })

    test('recusa criar evento em expedição em que não participa', async () => {
      const response = await agent.post(`/api/v1/expedicoes/${expB}/eventos`).set(expedicionario).send(diario).expect(403)
      expect(mensagem(response.body)).toBe(NAO_PARTICIPA)
    })

    test('edita e exclui o próprio evento', async () => {
      const eventoId = await criaEvento(expA, expedicionarioId)
      await agent.put(`/api/v1/eventos/${eventoId}`).set(expedicionario).send({ observacoes: 'novo' }).expect(200)
      await agent.delete(`/api/v1/eventos/${eventoId}`).set(expedicionario).expect(204)
    })

    test('não edita nem exclui evento de outra pessoa', async () => {
      const eventoId = await criaEvento(expA, curadorId)
      await agent.put(`/api/v1/eventos/${eventoId}`).set(expedicionario).send({ observacoes: 'novo' }).expect(403)
      await agent.delete(`/api/v1/eventos/${eventoId}`).set(expedicionario).expect(403)
    })

    test('não altera o próprio evento numa expedição de que saiu', async () => {
      const eventoId = await criaEvento(expB, expedicionarioId)
      await agent.put(`/api/v1/eventos/${eventoId}`).set(expedicionario).send({ observacoes: 'novo' }).expect(403)
    })

    test('curador segue editando eventos de qualquer pessoa', async () => {
      const eventoId = await criaEvento(expB, expedicionarioId)
      await agent.put(`/api/v1/eventos/${eventoId}`).set(curador).send({ observacoes: 'novo' }).expect(200)
    })
  })

  describe('evidências de evento', () => {
    test('anexa evidência a evento de outro participante', async () => {
      const eventoId = await criaEvento(expA, curadorId)
      const response = await agent
        .post(`/api/v1/eventos/${eventoId}/evidencias`)
        .set(expedicionario)
        .field('nome', 'IMG_0042.jpg')
        .field('data_captura', '2026-02-15T14:32:00Z')
        .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
      expect(response.status).toBe(201)
    })

    test('recusa anexar evidência em expedição em que não participa', async () => {
      const eventoId = await criaEvento(expB, expedicionarioId)
      await agent
        .post(`/api/v1/eventos/${eventoId}/evidencias`)
        .set(expedicionario)
        .field('nome', 'IMG_0042.jpg')
        .field('data_captura', '2026-02-15T14:32:00Z')
        .attach('arquivo', Buffer.from('conteúdo de teste'), { contentType: 'image/jpeg', filename: 'foto.jpg' })
        .expect(403)
    })

    test('exclui só a própria evidência', async () => {
      const eventoId = await criaEvento(expA, curadorId)
      const minha = await criaEvidencia(eventoId, expedicionarioId)
      const alheia = await criaEvidencia(eventoId, curadorId)
      await agent.delete(`/api/v1/evidencias/${alheia}`).set(expedicionario).expect(403)
      await agent.delete(`/api/v1/evidencias/${minha}`).set(expedicionario).expect(204)
    })
  })

  describe('lembretes', () => {
    test('cria lembrete na expedição em que participa e lembrete solto', async () => {
      await agent.post('/api/v1/lembretes').set(expedicionario).send({ ...lembrete, expedicao_id: expA }).expect(201)
      await agent.post('/api/v1/lembretes').set(expedicionario).send(lembrete).expect(201)
    })

    test('recusa criar lembrete em expedição em que não participa', async () => {
      await agent.post('/api/v1/lembretes').set(expedicionario).send({ ...lembrete, expedicao_id: expB }).expect(403)
    })

    test('edita o próprio lembrete solto, mas não o de outra pessoa', async () => {
      const meu = await criaLembrete(null, expedicionarioId)
      const alheio = await criaLembrete(null, curadorId)
      await agent.put(`/api/v1/lembretes/${meu}`).set(expedicionario).send(lembrete).expect(200)
      await agent.put(`/api/v1/lembretes/${alheio}`).set(expedicionario).send(lembrete).expect(403)
      await agent.delete(`/api/v1/lembretes/${alheio}`).set(expedicionario).expect(403)
    })

    test('não edita lembrete de outro participante da expedição', async () => {
      const alheio = await criaLembrete(expA, curadorId)
      await agent.put(`/api/v1/lembretes/${alheio}`).set(expedicionario).send(lembrete).expect(403)
    })

    test('anexa foto a lembrete de outro participante; recusa no lembrete solto alheio', async () => {
      const daExpedicao = await criaLembrete(expA, curadorId)
      const soltoAlheio = await criaLembrete(null, curadorId)

      const ok = await enviaFotoLembrete(daExpedicao, expedicionario).expect(201)
      arquivosLembrete.push((ok.body as { arquivo: string }).arquivo)

      await enviaFotoLembrete(soltoAlheio, expedicionario).expect(403)
    })

    test('recusa anexar foto a lembrete de expedição em que não participa, sem deixar arquivo em disco', async () => {
      const lembreteId = await criaLembrete(expB, curadorId)
      const doLembrete = () => {
        const diretorio = resolve('uploads', 'lembretes')
        return existsSync(diretorio)
          ? readdirSync(diretorio).filter(nome => nome.startsWith(`lembrete_${lembreteId}_`))
          : []
      }

      await enviaFotoLembrete(lembreteId, expedicionario).expect(403)

      expect(doLembrete()).toHaveLength(0)
      expect(await knex('lembretes_evidencias').where({ lembrete_id: lembreteId })).toHaveLength(0)
    })

    test('exclui só a própria foto de lembrete', async () => {
      const lembreteId = await criaLembrete(expA, curadorId)
      const minha = await criaLembreteEvidencia(lembreteId, expedicionarioId)
      const alheia = await criaLembreteEvidencia(lembreteId, curadorId)
      await agent.delete(`/api/v1/lembretes/${lembreteId}/evidencias/${alheia}`).set(expedicionario).expect(403)
      await agent.delete(`/api/v1/lembretes/${lembreteId}/evidencias/${minha}`).set(expedicionario).expect(204)
    })
  })
})
