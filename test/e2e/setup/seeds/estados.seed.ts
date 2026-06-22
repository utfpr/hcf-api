import type { Knex } from 'knex'

/**
 * Paises owned by lista-estados integration tests (used only as FK carriers).
 * Siglas are exactly 4 chars to fit bpchar(4).
 */
const paises = [
  { nome: 'XEST Brasil', sigla: 'XEBR' },
  { nome: 'XEST Argentina', sigla: 'XEAR' }
]

export async function seedEstados(
  knex: Knex
): Promise<Array<{ id: number; nome: string; sigla: string }>> {
  const [paisBrasil, paisArgentina] = await knex('paises')
    .insert(paises)
    .returning<Array<{ id: number; sigla: string }>>(['id', 'sigla'])

  return knex('estados')
    .insert([
      {
        nome: 'Paraná', sigla: 'XEPR', pais_id: paisBrasil.id
      },
      {
        nome: 'São Paulo', sigla: 'XESP', pais_id: paisBrasil.id
      },
      {
        nome: 'Buenos Aires', sigla: 'XEBA', pais_id: paisArgentina.id
      }
    ])
    .returning([
      'id',
      'nome',
      'sigla'
    ])
}

export async function cleanupEstados(knex: Knex): Promise<void> {
  await knex('estados').whereIn('sigla', [
    'XEPR',
    'XESP',
    'XEBA'
  ]).delete()
  await knex('paises').whereIn('sigla', paises.map(p => p.sigla)).delete()
}
