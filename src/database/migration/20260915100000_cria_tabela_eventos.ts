import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('eventos')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('eventos', table => {
      table.increments('id').primary()

      table.integer('expedicao_id').notNullable()
      table.foreign('expedicao_id')
        .references('id')
        .inTable('expedicoes')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.text('tipo').notNullable()
      table.timestamp('capturado_em').notNullable()

      table.double('latitude').nullable()
      table.double('longitude').nullable()
      table.double('altitude').nullable()

      table.text('observacoes').nullable()

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

      table.check('?? in (?, ?)', [
        'tipo',
        'DIARIO',
        'COLETA'
      ], 'eventos_tipo_check')

      table.index('expedicao_id', 'eventos_expedicao_id_index')
      table.index('capturado_em', 'eventos_capturado_em_index')
    })
  })
}
