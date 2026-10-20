import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('expedicoes_rotas_locais_coleta')
  if (hasTable) return

  await knex.transaction(async trx => {
    await trx.schema.createTable('expedicoes_rotas_locais_coleta', table => {
      table.increments('id').primary()

      table.integer('expedicao_rota_id').notNullable()
      table.foreign('expedicao_rota_id')
        .references('id')
        .inTable('expedicoes_rotas')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.bigInteger('local_coleta_id').notNullable()
      table.foreign('local_coleta_id')
        .references('id')
        .inTable('locais_coleta')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE')

      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now())

      table.unique(['expedicao_rota_id', 'local_coleta_id'], {
        indexName: 'expedicoes_rotas_locais_coleta_unique'
      })
      table.index('expedicao_rota_id', 'idx_rotas_locais_expedicao_rota')
      table.index('local_coleta_id', 'idx_rotas_locais_local_coleta')
    })
  })
}

export async function rollback(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('expedicoes_rotas_locais_coleta')
}
