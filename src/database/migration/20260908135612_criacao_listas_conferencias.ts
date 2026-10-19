import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.schema.dropTableIfExists('listas_conferencias')

    await trx.schema.createTable('listas_conferencias', table => {
      table.increments('id').primary()
      table.string('nome', 200).notNullable()
      table.text('descricao').nullable()
      table.timestamp('created_at').defaultTo(trx.fn.now())
      table.timestamp('updated_at').defaultTo(trx.fn.now())
    })
  })
}
