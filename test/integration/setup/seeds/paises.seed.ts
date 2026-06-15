import type { Knex } from 'knex'

/**
 * Paises owned by lista-paises integration tests.
 * Siglas are exactly 4 chars to fit bpchar(4).
 * Names are prefixed with 'XPAI' so the test can filter via ?nome=XPAI
 * without touching other test files' rows.
 */
export const paises = [
  { nome: 'XPAI Argentina', sigla: 'XPAR' },
  { nome: 'XPAI Brasil',    sigla: 'XPBR' }
]

export async function seedPaises(
  knex: Knex
): Promise<Array<{ id: number; nome: string; sigla: string }>> {
  return knex('paises').insert(paises).returning(['id', 'nome', 'sigla'])
}

export async function cleanupPaises(knex: Knex): Promise<void> {
  await knex('paises').whereIn('sigla', paises.map(p => p.sigla)).delete()
}
