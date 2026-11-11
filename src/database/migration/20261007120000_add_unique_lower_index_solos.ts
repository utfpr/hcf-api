import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS solos_nome_lower_uidx
    ON solos (LOWER(nome));
  `)
}
