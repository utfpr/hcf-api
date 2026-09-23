import { afterAll, describe, expect, test } from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { cadastrarLocalColeta, atualizarLocalColeta } from '@/controllers/locais-coleta-controller'

describe('Locais de coleta', () => {
  const { knex } = createTestApp()

  afterAll(() => knex.destroy())

  test('rejeita cadastro de local duplicado na mesma cidade', async () => {
    const paisSigla = `X${Date.now().toString().slice(-3)}`.padEnd(4, 'X')
    const estadoSigla = `Y${Date.now().toString().slice(-3)}`.padEnd(4, 'Y')
    const [pais] = await knex('paises').insert({ nome: `XLOC Pais ${Date.now()}`, sigla: paisSigla }).returning(['id'])
    const [estado] = await knex('estados').insert({ nome: `XLOC Estado ${Date.now()}`, sigla: estadoSigla, pais_id: pais.id }).returning(['id'])
    const [cidade] = await knex('cidades').insert({ nome: `XLOC Cidade ${Date.now()}`, estado_id: estado.id }).returning(['id'])

    const prefix = `XLOC-${Date.now()}`
    const descricao = `${prefix} Campo do rio`

    const response1 = {
      statusCode: 0,
      body: null as unknown,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: unknown) {
        this.body = body
        return this
      }
    }

    let nextError: Error | undefined
    const next = (error: Error) => {
      nextError = error
    }

    try {
      await cadastrarLocalColeta({ body: { descricao, cidade_id: cidade.id } }, response1, next)
      expect(response1.statusCode).toBe(201)

      await cadastrarLocalColeta({ body: { descricao: `  ${descricao.toUpperCase()}  `, cidade_id: cidade.id } }, response1, next)
      expect(nextError).toBeDefined()
      expect(nextError?.message).toMatch(/já existe|duplicad/i)

      const total = await knex('locais_coleta').count<{ count: string }[]>({ count: '*' }).where({ cidade_id: cidade.id, descricao })
      expect(Number(total[0].count)).toBe(1)
    } finally {
      await knex('locais_coleta').where('descricao', 'like', `%${prefix}%`).delete()
      await knex('cidades').where({ id: cidade.id }).delete()
      await knex('estados').where({ id: estado.id }).delete()
      await knex('paises').where({ id: pais.id }).delete()
    }
  })

  test('rejeita atualização de local para uma descrição já existente na mesma cidade', async () => {
    const paisSigla = `X${Date.now().toString().slice(-3)}`.padEnd(4, 'X')
    const estadoSigla = `Y${Date.now().toString().slice(-3)}`.padEnd(4, 'Y')
    const [pais] = await knex('paises').insert({ nome: `XLOC Pais ${Date.now()}`, sigla: paisSigla }).returning(['id'])
    const [estado] = await knex('estados').insert({ nome: `XLOC Estado ${Date.now()}`, sigla: estadoSigla, pais_id: pais.id }).returning(['id'])
    const [cidade] = await knex('cidades').insert({ nome: `XLOC Cidade ${Date.now()}`, estado_id: estado.id }).returning(['id'])

    const prefix = `XLOC-${Date.now()}`
    const [primeiro] = await knex('locais_coleta').insert({ descricao: `${prefix} original`, cidade_id: cidade.id }).returning(['id'])
    const [segundo] = await knex('locais_coleta').insert({ descricao: `${prefix} novo`, cidade_id: cidade.id }).returning(['id'])

    const response = {
      statusCode: 0,
      body: null as unknown,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: unknown) {
        this.body = body
        return this
      }
    }

    let nextError: Error | undefined
    const next = (error: Error) => {
      nextError = error
    }

    try {
      await atualizarLocalColeta({
        params: { id: segundo.id },
        body: { descricao: `${prefix} original`, cidade_id: cidade.id }
      }, response, next)

      expect(nextError).toBeDefined()
      expect(nextError?.message).toMatch(/já existe|duplicad/i)
    } finally {
      await knex('locais_coleta').whereIn('id', [primeiro.id, segundo.id]).delete()
      await knex('cidades').where({ id: cidade.id }).delete()
      await knex('estados').where({ id: estado.id }).delete()
      await knex('paises').where({ id: pais.id }).delete()
    }
  })
})
