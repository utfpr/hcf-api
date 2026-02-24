import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE locais_coleta
    DROP COLUMN IF EXISTS complemento
  `)
}
