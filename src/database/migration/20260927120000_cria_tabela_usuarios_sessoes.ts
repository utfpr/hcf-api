import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.schema.createTable('usuarios_sessoes', table => {
      table.uuid('id').primary().defaultTo(trx.raw('gen_random_uuid()'))

      table.integer('usuario_id').notNullable()
      table.foreign('usuario_id')
        .references('id')
        .inTable('usuarios')
      table.index('usuario_id')

      table.string('refresh_token_hash', 64).notNullable().unique()

      table.timestamp('created_at').notNullable().defaultTo(trx.fn.now())
      table.timestamp('last_used_at').notNullable()
      table.timestamp('expires_at').notNullable()
    })
  })
}
