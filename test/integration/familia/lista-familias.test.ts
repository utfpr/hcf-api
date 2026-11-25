import {
  afterAll, describe, expect, test
} from 'vitest'

import { createTestApp } from '../setup/app-factory'

type Row = { id: number | string; nome: string }

const returning = ['id', 'nome'] as const

describe('GET /api/v1/familias', () => {
  const { agent, knex } = createTestApp()

  afterAll(() => knex.destroy())

  async function criaReino(nome: string): Promise<{ id: number; nome: string }> {
    const [reino] = await knex('reinos').insert({ nome }).returning<Row[]>(returning)
    return { id: Number(reino.id), nome: reino.nome }
  }

  async function criaFamilias(nomes: string[], reinoId: number): Promise<{ id: number; nome: string }[]> {
    const rows = await knex('familias')
      .insert(nomes.map(nome => ({ nome, reino_id: reinoId })))
      .returning<Row[]>(returning)
    return rows.map(row => ({ id: Number(row.id), nome: row.nome }))
  }

  async function limpa(familias: { id: number }[], reino: { id: number }) {
    await knex('familias').whereIn('id', familias.map(familia => familia.id)).delete()
    await knex('reinos').where({ id: reino.id }).delete()
  }

  test('lista famílias com o reino e usa id decrescente como ordenação padrão', async () => {
    const prefix = `XFAM-${Date.now()}`
    const reino = await criaReino(`${prefix} Reino`)
    const familias = await criaFamilias([
      `${prefix} B`,
      `${prefix} A`,
      `${prefix} C`
    ], reino.id)

    try {
      const response = await agent.get(`/api/v1/familias?nome=${prefix}`).expect(200)
      const expected = [...familias]
        .sort((a, b) => b.id - a.id)
        .map(familia => ({ ...familia, reino }))
      expect(response.body).toEqual(expected)
    } finally {
      await limpa(familias, reino)
    }
  })

  test('filtra por nome ou pelo alias legado familia, sem diferenciar maiúsculas e minúsculas', async () => {
    const prefix = `XFAM-${Date.now()}`
    const reino = await criaReino(`${prefix} Reino`)
    const familias = await criaFamilias([`${prefix} Asteraceae`, `${prefix} Fabaceae`], reino.id)

    try {
      const filtro = encodeURIComponent(`${prefix.toLowerCase()} asteraceae`)
      const expected = [{ ...familias[0], reino }]

      const porNome = await agent.get(`/api/v1/familias?nome=${filtro}`).expect(200)
      expect(porNome.body).toEqual(expected)

      const porFamilia = await agent.get(`/api/v1/familias?familia=${filtro}`).expect(200)
      expect(porFamilia.body).toEqual(expected)
    } finally {
      await limpa(familias, reino)
    }
  })

  test('filtra por reino_id', async () => {
    const prefix = `XFAM-${Date.now()}`
    const reinoA = await criaReino(`${prefix} Reino A`)
    const reinoB = await criaReino(`${prefix} Reino B`)
    const familiasA = await criaFamilias([`${prefix} Da A`], reinoA.id)
    const familiasB = await criaFamilias([`${prefix} Da B`], reinoB.id)

    try {
      const response = await agent.get(`/api/v1/familias?nome=${prefix}&reino_id=${reinoB.id}`).expect(200)
      expect(response.body).toEqual([{ ...familiasB[0], reino: reinoB }])
    } finally {
      await limpa(familiasA, reinoA)
      await limpa(familiasB, reinoB)
    }
  })

  test('aceita ordenação crescente e decrescente por id, nome e reino', async () => {
    const prefix = `XFAM-${Date.now()}`
    const reinoA = await criaReino(`${prefix} Reino A`)
    const reinoZ = await criaReino(`${prefix} Reino Z`)
    const familiasA = await criaFamilias([`${prefix} M`], reinoZ.id)
    const familiasB = await criaFamilias([`${prefix} Z`, `${prefix} A`], reinoA.id)
    const todas = [
      ...familiasA.map(familia => ({ ...familia, reino: reinoZ })),
      ...familiasB.map(familia => ({ ...familia, reino: reinoA }))
    ]

    try {
      const busca = async (order: string) => (await agent.get(`/api/v1/familias?nome=${prefix}&order=${order}`).expect(200)).body as unknown

      expect(await busca('id:asc')).toEqual([...todas].sort((a, b) => a.id - b.id))
      expect(await busca('id:desc')).toEqual([...todas].sort((a, b) => b.id - a.id))
      expect(await busca('nome:asc')).toEqual([...todas].sort((a, b) => a.nome.localeCompare(b.nome)))
      expect(await busca('nome:desc')).toEqual([...todas].sort((a, b) => b.nome.localeCompare(a.nome)))

      const porReinoAsc = await busca('reino:asc') as { reino: { id: number } }[]
      expect(porReinoAsc.map(familia => familia.reino.id)).toEqual([
        reinoA.id,
        reinoA.id,
        reinoZ.id
      ])
      const porReinoDesc = await busca('reino:desc') as { reino: { id: number } }[]
      expect(porReinoDesc.map(familia => familia.reino.id)).toEqual([
        reinoZ.id,
        reinoA.id,
        reinoA.id
      ])
    } finally {
      await limpa(familiasA, reinoZ)
      await limpa(familiasB, reinoA)
    }
  })

  test('retorna 400 para ordenação e reino_id inválidos', async () => {
    for (const query of ['order=foo:bar', 'reino_id=abc']) {
      const response = await agent.get(`/api/v1/familias?${query}`).expect(400)
      const body = response.body as { error: { message: string } }
      expect(body.error.message).toMatch(/inválido|invalid/i)
    }
  })

  test('retorna 400 quando os parâmetros são repetidos na consulta', async () => {
    const queries = [
      'order=id:asc&order=nome:desc',
      'nome=a&nome=b',
      'familia=a&familia=b',
      'reino_id=1&reino_id=2'
    ]
    for (const query of queries) {
      const response = await agent.get(`/api/v1/familias?${query}`).expect(400)
      const body = response.body as { error: { message: string } }
      expect(body.error.message).toMatch(/strings/i)
    }
  })
})
