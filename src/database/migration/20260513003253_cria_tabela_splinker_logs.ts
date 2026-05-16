import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('splinker_logs')
  if (!hasTable) {
    await knex.schema.createTable('splinker_logs', table => {
      table.increments('id').primary()
      table.timestamp('data_hora').defaultTo(knex.fn.now())
      table.integer('max_tombo_hcf')
      table.boolean('sucesso')
      table.text('log_saida')
    })
  }
}
