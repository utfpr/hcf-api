import type { Knex } from 'knex'

import { seedPaises } from './paises.seed'

export const estados = [
  {
    id: 1, nome: 'Paraná', sigla: 'PR', paises_sigla: 'BRA'
  },
  {
    id: 2, nome: 'São Paulo', sigla: 'SP', paises_sigla: 'BRA'
  },
  {
    id: 3, nome: 'Buenos Aires', sigla: 'BA', paises_sigla: 'ARG'
  }
]

export async function seedEstados(knex: Knex): Promise<void> {
  await seedPaises(knex)
  await knex('estados').insert(estados)
}
