import { Knex } from 'knex'

/**
 * Multimídia (fotos, vídeos e áudios) do lembrete, no mesmo formato das
 * evidências do evento. O arquivo fica em `uploads/lembretes`.
 */
export async function run(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('lembretes_evidencias')
  if (hasTable) {
    return
  }

  await knex.transaction(async trx => {
    await trx.schema.createTable('lembretes_evidencias', table => {
      table.increments('id').primary()

      table.integer('lembrete_id').notNullable()
      table.foreign('lembrete_id')
        .references('id')
        .inTable('lembretes')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.string('nome', 255).notNullable()
      table.string('arquivo', 255).notNullable()
      table.string('mime_type', 100).notNullable()
      table.bigInteger('tamanho').notNullable()
      table.timestamp('data_captura').notNullable()

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

      table.index('lembrete_id', 'lembretes_evidencias_lembrete_id_index')
    })
  })
}
