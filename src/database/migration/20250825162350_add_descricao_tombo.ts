import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.schema.table('tombos', (table) => {
    table.text('descricao').nullable()
  })
}
