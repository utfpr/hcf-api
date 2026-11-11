import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('evidencias', 'arquivo')
  if (hasColumn) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.alterTable('evidencias', table => {
      table.string('arquivo', 255).notNullable()
      table.string('mime_type', 100).notNullable()
      table.bigInteger('tamanho').notNullable()
    })
  })
}
