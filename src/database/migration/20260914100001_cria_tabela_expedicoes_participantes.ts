import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('expedicoes_participantes')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('expedicoes_participantes', table => {
      table.increments('id').primary()

      table.integer('expedicao_id').notNullable()
      table.foreign('expedicao_id')
        .references('id')
        .inTable('expedicoes')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.bigInteger('usuario_id').notNullable()
      table.foreign('usuario_id')
        .references('id')
        .inTable('usuarios')
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

      table.unique(['expedicao_id', 'usuario_id'], { indexName: 'expedicoes_participantes_expedicao_id_usuario_id_unique' })
    })
  })
}
