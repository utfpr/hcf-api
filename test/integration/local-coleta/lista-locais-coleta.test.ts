import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'
import { createCuradorAuth, createUsuarioAuth } from '../setup/curador-auth'

interface LocalColetaListResponse {
  metadados?: { total: number; pagina: number; limite: number }
  resultado: Array<{
    id: number
    descricao: string
    cidade: { estado: { pais: { id: number } | null } | null } | null
    fase_sucessional: { id: number } | null
  }>
}

describe('GET /api/v1/locais-coleta', () => {
  const { agent, knex } = createTestApp()
  let auth: Awaited<ReturnType<typeof createCuradorAuth>>

  beforeAll(async () => {
    auth = await createCuradorAuth(knex)
  })

  afterAll(async () => {
    await auth?.cleanup()
    await knex.destroy()
  })

  const getAuthorized = (path: string) => agent.get(path).set(auth.header)

  test('filtra por descrição e localização, pagina e suporta getAll', async () => {
    const suffix = Date.now()
    const prefix = `XLC-${suffix}`
    const [pais] = await knex('paises')
      .insert({ nome: `${prefix} País`, sigla: `P${String(suffix).slice(-3)}` })
      .returning(['id']) as Array<{ id: number }>
    const [estado] = await knex('estados')
      .insert({
        nome: `${prefix} Estado`,
        sigla: `E${String(suffix).slice(-3)}`,
        pais_id: pais.id
      })
      .returning(['id']) as Array<{ id: number }>
    const [cidade] = await knex('cidades')
      .insert({ nome: `${prefix} Cidade`, estado_id: estado.id })
      .returning(['id']) as Array<{ id: number }>
    const [fase] = await knex('fase_sucessional')
      .insert({ nome: `${prefix} Fase` })
      .returning(['id']) as Array<{ id: number }>
    const descricoes = [
      `${prefix} Z`,
      `${prefix} A`,
      `${prefix} M`
    ]
    const locais = await knex('locais_coleta')
      .insert(descricoes.map(descricao => ({
        descricao,
        cidade_id: cidade.id,
        fase_sucessional_id: fase.id
      })))
      .returning(['id', 'descricao']) as Array<{ id: number; descricao: string }>

    try {
      const baseQuery = `descricao=${encodeURIComponent(prefix.toLowerCase())}`
      const primeiraPagina = await getAuthorized(
        `/api/v1/locais-coleta?${baseQuery}&cidade_id=${cidade.id}&limite=1&pagina=1&order=descricao:asc`
      )
        .expect(200)
      const primeiraPaginaBody = primeiraPagina.body as LocalColetaListResponse
      expect(primeiraPaginaBody.metadados).toEqual({
        total: 3,
        pagina: 1,
        limite: 1
      })
      expect(primeiraPaginaBody.resultado).toHaveLength(1)
      expect(primeiraPaginaBody.resultado[0].descricao).toBe(`${prefix} A`)

      const segundaPagina = await getAuthorized(
        `/api/v1/locais-coleta?estado_id=${estado.id}&limite=1&pagina=2&descricao=${encodeURIComponent(prefix)}&order=descricao:asc`
      )
        .expect(200)
      const segundaPaginaBody = segundaPagina.body as LocalColetaListResponse
      expect(segundaPaginaBody.resultado[0].descricao).toBe(`${prefix} M`)

      const porPais = await getAuthorized(
        `/api/v1/locais-coleta?pais_id=${pais.id}&getAll=true&descricao=${encodeURIComponent(prefix)}&order=descricao:asc`
      )
        .expect(200)
      const porPaisBody = porPais.body as LocalColetaListResponse
      expect(porPaisBody.metadados).toBeUndefined()
      expect(porPaisBody.resultado.map(local => local.descricao))
        .toEqual([
          `${prefix} A`,
          `${prefix} M`,
          `${prefix} Z`
        ])
      expect(porPaisBody.resultado[0].cidade?.estado?.pais?.id).toBe(pais.id)
      expect(porPaisBody.resultado[0].fase_sucessional?.id).toBe(fase.id)

      const baseOrderQuery = `getAll=true&descricao=${encodeURIComponent(prefix)}`
      const padrao = await getAuthorized(`/api/v1/locais-coleta?${baseOrderQuery}`).expect(200)
      const padraoBody = padrao.body as LocalColetaListResponse
      expect(padraoBody.resultado.map(local => local.id))
        .toEqual([...locais].sort((a, b) => b.id - a.id).map(local => local.id))

      const idAsc = await getAuthorized(`/api/v1/locais-coleta?${baseOrderQuery}&order=id:asc`).expect(200)
      const idAscBody = idAsc.body as LocalColetaListResponse
      expect(idAscBody.resultado.map(local => local.id))
        .toEqual([...locais].sort((a, b) => a.id - b.id).map(local => local.id))

      const descricaoDesc = await getAuthorized(
        `/api/v1/locais-coleta?${baseOrderQuery}&order=descricao:desc`
      ).expect(200)
      const descricaoDescBody = descricaoDesc.body as LocalColetaListResponse
      expect(descricaoDescBody.resultado.map(local => local.descricao))
        .toEqual([
          `${prefix} Z`,
          `${prefix} M`,
          `${prefix} A`
        ])

      const idDesc = await getAuthorized(`/api/v1/locais-coleta?${baseOrderQuery}&order=id:desc`).expect(200)
      const idDescBody = idDesc.body as LocalColetaListResponse
      expect(idDescBody.resultado.map(local => local.id))
        .toEqual([...locais].sort((a, b) => b.id - a.id).map(local => local.id))
    } finally {
      await knex('locais_coleta').whereIn('id', locais.map(local => local.id)).delete()
      await knex('fase_sucessional').where({ id: fase.id }).delete()
      await knex('cidades').where({ id: cidade.id }).delete()
      await knex('estados').where({ id: estado.id }).delete()
      await knex('paises').where({ id: pais.id }).delete()
    }
  })

  test('rejeita parâmetros de paginação inválidos', async () => {
    const respostas = await Promise.all([
      getAuthorized('/api/v1/locais-coleta?limite=0').expect(400),
      getAuthorized('/api/v1/locais-coleta?pagina=-1').expect(400),
      getAuthorized('/api/v1/locais-coleta?limite=nao-numerico').expect(400)
    ])

    for (const resposta of respostas) {
      const body = resposta.body as { error: { message: string } }
      expect(body.error.message).toMatch(/limite|pagina/i)
    }
  })

  test('retorna 400 quando a ordenação é inválida', async () => {
    const response = await getAuthorized('/api/v1/locais-coleta?order=descricao:sideways').expect(400)
    const body = response.body as { error: { message: string } }
    expect(body.error.message).toMatch(/order inválido/i)
  })

  test('retorna 400 quando um filtro de localização não é inteiro positivo', async () => {
    const respostas = await Promise.all([
      getAuthorized('/api/v1/locais-coleta?cidade_id=abc').expect(400),
      getAuthorized('/api/v1/locais-coleta?estado_id=-2').expect(400),
      getAuthorized('/api/v1/locais-coleta?pais_id=0').expect(400)
    ])

    for (const resposta of respostas) {
      const body = resposta.body as { error: { message: string } }
      expect(body.error.message).toMatch(/cidade_id|estado_id|pais_id/i)
    }
  })

  test('exige token e bloqueia tipos fora das permissões legadas', async () => {
    await agent.get('/api/v1/locais-coleta').expect(401)

    const authNaoPermitido = await createUsuarioAuth(knex, 99, 'Sem permissão')
    try {
      await agent.get('/api/v1/locais-coleta').set(authNaoPermitido.header).expect(403)
    } finally {
      await authNaoPermitido.cleanup()
    }
  })
})
