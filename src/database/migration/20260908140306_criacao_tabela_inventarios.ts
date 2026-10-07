import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.schema.dropTableIfExists('inventarios')

    await trx.schema.createTable('inventarios', table => {
      table.increments('id').primary()
      table.integer('lista_conferencia_id').notNullable()
      table.integer('usuario_id').nullable()
      table.integer('total_esperado').notNullable().defaultTo(0)
      table.integer('total_encontrados').notNullable().defaultTo(0)
      table.integer('total_nao_encontrados').notNullable().defaultTo(0)
      table.jsonb('status').notNullable().defaultTo(trx.raw(`'{}'::jsonb`))

      table.timestamp('created_at').defaultTo(trx.fn.now())
      table.timestamp('updated_at').defaultTo(trx.fn.now())

      table.foreign('lista_conferencia_id')
        .references('id')
        .inTable('listas_conferencias')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE')

      table.foreign('usuario_id')
        .references('id')
        .inTable('usuarios')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
    })
  })
}
