import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    
    await trx.schema.dropTableIfExists('rfids')

    await trx.schema.createTable('rfids', table => {
      table.increments('id').primary()
      
      table.integer('tombo_foto_id').unsigned().notNullable()
      table.foreign('tombo_foto_id')
        .references('id')
        .inTable('tombos_fotos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.string('epc', 96).notNullable().unique()
      table.string('tid', 96).nullable().unique()
      
      table.string('status', 20).notNullable().defaultTo('PENDENTE')
      table.timestamp('created_at').defaultTo(trx.fn.now())
      table.timestamp('updated_at').defaultTo(trx.fn.now())
    })
  })
}
