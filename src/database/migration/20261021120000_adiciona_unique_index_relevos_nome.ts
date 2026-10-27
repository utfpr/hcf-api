import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('relevos')

  if (!tableExists) {
    return
  }

  const indexExists = await knex.raw(`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'relevos'
      AND indexname = 'relevos_nome_unique'
    LIMIT 1
  `)

  if (indexExists.rowCount === 0 || indexExists.rows?.length === 0) {
    await knex.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS relevos_nome_unique
      ON relevos (LOWER(nome))
    `)
  }
}
