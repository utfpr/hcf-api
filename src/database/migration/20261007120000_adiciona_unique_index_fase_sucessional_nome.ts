import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS fase_sucessional_nome_lower_uidx
    ON public.fase_sucessional (LOWER(nome))
  `)
}
