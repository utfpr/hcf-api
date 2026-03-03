import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('cidades', 'poligono')
  if (!hasColumn) {
    await knex.raw(`
      ALTER TABLE cidades
      ADD COLUMN poligono GEOMETRY(MultiPolygon, 4674) DEFAULT NULL
    `)
  }
}
