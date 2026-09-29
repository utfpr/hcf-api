import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('evidencias')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('evidencias', table => {
      table.increments('id').primary()

      table.integer('evento_id').notNullable()
      table.foreign('evento_id')
        .references('id')
        .inTable('eventos')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.string('nome', 255).notNullable()
      table.timestamp('capturado_em').notNullable()

      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now())
      table.timestamp('updated_at').notNullable().defaultTo(trx.fn.now())

      table.bigInteger('created_by').nullable()
      table.foreign('created_by')
        .references('id')
        .inTable('usuarios')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

      table.bigInteger('updated_by').nullable()
      table.foreign('updated_by')
        .references('id')
        .inTable('usuarios')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

      table.index('evento_id', 'evidencias_evento_id_index')
    })
  })
}
