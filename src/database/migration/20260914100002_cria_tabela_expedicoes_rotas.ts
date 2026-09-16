import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('expedicoes_rotas')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('expedicoes_rotas', table => {
      table.increments('id').primary()

      table.integer('expedicao_id').notNullable()
      table.foreign('expedicao_id')
        .references('id')
        .inTable('expedicoes')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.bigInteger('cidade_id').notNullable()
      table.foreign('cidade_id')
        .references('id')
        .inTable('cidades')
        .onDelete('NO ACTION')
        .onUpdate('CASCADE')

      table.specificType('ordem', 'smallint').notNullable()

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

      table.unique(['expedicao_id', 'ordem'], { indexName: 'expedicoes_rotas_expedicao_id_ordem_unique' })
      table.index('cidade_id', 'expedicoes_rotas_cidade_id_index')
    })
  })
}
