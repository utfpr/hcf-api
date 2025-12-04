import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasColumn = await trx.schema.hasColumn('estados', 'codigo_telefone')
    if (hasColumn) {
      await trx.schema.alterTable('estados', table => {
        table.dropColumn('codigo_telefone')
      })
    }
  })
}
