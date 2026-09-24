import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { ColetaAttributes } from '@/domain/evento/Evento'

import { createTestApp } from '../setup/app-factory'
import {
  cleanupExpedicaoFixtures, ExpedicaoFixtures, seedExpedicaoFixtures
} from '../setup/seeds/expedicao.seed'

const ficha: ColetaAttributes = {
  associacoes: 'Lychnophora ericoides',
  estado: 'MG',
  familia: 'Velloziaceae',
  flores: 'Presentes, lilases',
  folhas: 'Lineares, rígidas',
  frutos: 'Ausentes',
  habito: 'Herbácea',
  luminosidade: 'Pleno sol',
  municipio: 'Serra do Cipó',
  nome_cientifico: 'Vellozia squamata',
  nome_popular: 'canela-de-ema',
  referencia_local: 'Trilha da cachoeira, 300 m após a ponte',
  relevo: 'Ondulado',
  solo: 'Arenoso',
  substrato: 'Afloramento rochoso',
  tipo_vegetacao: 'Campo rupestre',
  tronco_com_casca: 'Sim, gretada'
}

interface EventoBody {
  id: number
  tipo: string
  observacoes: string | null
  coleta: Record<string, unknown> | null
}

function asEvento(body: unknown): EventoBody {
  return body as EventoBody
}

describe('Eventos (escrita, HTTP)', () => {
  const { agent, knex } = createTestApp()

  let fixtures: ExpedicaoFixtures
  let expedicaoId: number

  beforeAll(async () => {
    fixtures = await seedExpedicaoFixtures(knex)

    const [expedicao] = await knex('expedicoes')
      .insert({
        cidade_id: fixtures.cidades[0], data_fim: '2026-02-18', data_inicio: '2026-02-14', descricao: 'XEVT eventos http'
      })
      .returning<Array<{ id: number }>>(['id'])

    expedicaoId = expedicao.id
  })

  afterAll(async () => {
    await knex('expedicoes').where({ id: expedicaoId }).delete()
    await cleanupExpedicaoFixtures(knex, fixtures)
    await knex.destroy()
  })

  test('POST cria um evento DIARIO', async () => {
    const response = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z',
        latitude: -20.2508,
        longitude: -46.4167,
        observacoes: 'Área de transição entre cerrado e campo rupestre.',
        tipo: 'DIARIO'
      })
      .expect(201)

    const body = asEvento(response.body)

    try {
      expect(body).toMatchObject({ coleta: null, tipo: 'DIARIO' })
    } finally {
      await knex('eventos').where({ id: body.id }).delete()
    }
  })

  test('POST cria um evento COLETA com a ficha', async () => {
    const response = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', coleta: ficha, latitude: -20.2508, longitude: -46.4167, tipo: 'COLETA'
      })
      .expect(201)

    const body = asEvento(response.body)

    try {
      expect(body.coleta).toEqual(ficha)
    } finally {
      await knex('eventos').where({ id: body.id }).delete()
    }
  })

  test('POST retorna 400 quando COLETA não envia ficha', async () => {
    await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', latitude: -20.25, longitude: -46.41, tipo: 'COLETA'
      })
      .expect(400)
  })

  test('POST retorna 404 quando a expedição não existe', async () => {
    await agent
      .post('/api/v2/expedicoes/999999999/eventos')
      .send({
        capturado_em: '2026-02-15T14:32:00Z', latitude: -20.25, longitude: -46.41, observacoes: 'x', tipo: 'DIARIO'
      })
      .expect(404)
  })

  test('PUT atualiza campos comuns', async () => {
    const created = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', latitude: -20.25, longitude: -46.41, observacoes: 'original', tipo: 'DIARIO'
      })
      .expect(201)

    const eventoId = asEvento(created.body).id

    try {
      const response = await agent
        .put(`/api/v2/eventos/${eventoId}`)
        .send({ observacoes: 'atualizado' })
        .expect(200)

      expect(asEvento(response.body).observacoes).toBe('atualizado')
    } finally {
      await knex('eventos').where({ id: eventoId }).delete()
    }
  })

  test('PUT troca DIARIO para COLETA criando a ficha', async () => {
    const created = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', latitude: -20.25, longitude: -46.41, observacoes: 'original', tipo: 'DIARIO'
      })
      .expect(201)

    const eventoId = asEvento(created.body).id

    try {
      const response = await agent
        .put(`/api/v2/eventos/${eventoId}`)
        .send({ coleta: ficha, tipo: 'COLETA' })
        .expect(200)

      expect(asEvento(response.body)).toMatchObject({ coleta: ficha, tipo: 'COLETA' })
    } finally {
      await knex('eventos').where({ id: eventoId }).delete()
    }
  })

  test('PUT troca COLETA para DIARIO apagando a ficha', async () => {
    const created = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', coleta: ficha, latitude: -20.25, longitude: -46.41, tipo: 'COLETA'
      })
      .expect(201)

    const eventoId = asEvento(created.body).id

    try {
      const response = await agent
        .put(`/api/v2/eventos/${eventoId}`)
        .send({ observacoes: 'virou diário', tipo: 'DIARIO' })
        .expect(200)

      expect(asEvento(response.body)).toMatchObject({ coleta: null, tipo: 'DIARIO' })

      const fichas = await knex('eventos_coletas').where({ evento_id: eventoId })
      expect(fichas).toHaveLength(0)
    } finally {
      await knex('eventos').where({ id: eventoId }).delete()
    }
  })

  test('PUT retorna 404 quando o evento não existe', async () => {
    await agent.put('/api/v2/eventos/999999999').send({ observacoes: 'x' }).expect(404)
  })

  test('DELETE remove o evento e a ficha (cascade)', async () => {
    const created = await agent
      .post(`/api/v2/expedicoes/${expedicaoId}/eventos`)
      .send({
        capturado_em: '2026-02-15T14:32:00Z', coleta: ficha, latitude: -20.25, longitude: -46.41, tipo: 'COLETA'
      })
      .expect(201)

    const eventoId = asEvento(created.body).id

    await agent.delete(`/api/v2/eventos/${eventoId}`).expect(204)

    const eventoRow = await knex('eventos').where({ id: eventoId }).first()
    const coletaRow = await knex('eventos_coletas').where({ evento_id: eventoId }).first()
    expect(eventoRow).toBeUndefined()
    expect(coletaRow).toBeUndefined()
  })

  test('DELETE retorna 404 quando o evento não existe', async () => {
    await agent.delete('/api/v2/eventos/999999999').expect(404)
  })
})
