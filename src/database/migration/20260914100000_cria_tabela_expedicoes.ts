import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('expedicoes')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('expedicoes', table => {
      table.increments('id').primary()

      table.text('descricao').nullable()
      table.date('data_inicio').notNullable()
      table.date('data_fim').notNullable()

      table.bigInteger('cidade_id').notNullable()
      table.foreign('cidade_id')
        .references('id')
        .inTable('cidades')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

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

      table.index('cidade_id', 'expedicoes_cidade_id_index')
    })
  })
}
