import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const result = await knex.raw(`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'cidades'
        AND indexname = 'idx_cidades_poligono_gist'
    ) AS exists
  `)
  const { exists } = result.rows[0]

  if (!exists) {
    await knex.raw(`
      CREATE INDEX idx_cidades_poligono_gist
      ON cidades
      USING GiST (poligono)
    `)
  }
}
