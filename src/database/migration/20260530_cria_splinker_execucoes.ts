import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('splinker_execucoes')
  if (!hasTable) {
    await knex.schema.createTable('splinker_execucoes', table => {
      table.increments('id').primary()
      table.timestamp('data_hora').defaultTo(knex.fn.now())
      table.integer('ultimo_tombo_hcf')
      table.boolean('sucesso')
      table.text('log_saida')
    })
  }
}
