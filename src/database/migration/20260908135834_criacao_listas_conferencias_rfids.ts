import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.schema.dropTableIfExists('listas_conferencias_rfids')

    await trx.schema.createTable('listas_conferencias_rfids', table => {
      table.increments('id').primary()
      table.integer('lista_conferencia_id').notNullable()
      table.integer('rfid_id').notNullable()

      table.foreign('lista_conferencia_id')
        .references('id')
        .inTable('listas_conferencias')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.foreign('rfid_id')
        .references('id')
        .inTable('rfids')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.unique(['lista_conferencia_id', 'rfid_id'])
      table.timestamp('created_at').defaultTo(trx.fn.now())
      table.timestamp('updated_at').defaultTo(trx.fn.now())
    })
  })
}
