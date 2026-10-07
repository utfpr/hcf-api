import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('vegetacoes')

  if (!tableExists) {
    return
  }

  const indexExists = await knex.raw(`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'vegetacoes'
      AND indexname = 'vegetacoes_nome_unique'
    LIMIT 1
  `)

  if (indexExists.rowCount === 0 || indexExists.rows?.length === 0) {
    await knex.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS vegetacoes_nome_unique
      ON vegetacoes (LOWER(nome))
    `)
  }
}
