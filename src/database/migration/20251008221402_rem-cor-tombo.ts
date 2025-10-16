import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const existeColuna = await knex.schema.hasColumn('tombos', 'cor')
  if (existeColuna) {
    await knex.schema.alterTable('tombos', table => {
      table.dropColumn('cor')
    })
  }
}
