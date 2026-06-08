import type { Knex } from 'knex'

export const paises = [
  {
    id: 1,
    nome: 'Brasil',
    sigla: 'BRA'
  },
  {
    id: 2,
    nome: 'Argentina',
    sigla: 'ARG'
  }
]

export async function seedPaises(knex: Knex): Promise<void> {
  await knex.raw('TRUNCATE TABLE estados RESTART IDENTITY CASCADE')
  await knex.raw('TRUNCATE TABLE paises RESTART IDENTITY CASCADE')
  await knex('paises').insert(paises)
}
