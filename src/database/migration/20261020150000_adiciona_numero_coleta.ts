import { Knex } from 'knex'

/**
 * Número da coleta: várias pessoas, cada uma no seu celular, registram a mesma
 * coleta física com o mesmo número. Na API tudo vira um evento só por número
 * dentro da expedição, com as evidências de todos os aparelhos.
 *
 * - eventos.numero_coleta + índice único parcial: o banco garante uma coleta
 *   por número na expedição, mesmo com dois celulares sincronizando juntos.
 * - eventos_envios: um registro por envio de cada aparelho (client_uuid). Um envio
 *   juntado a uma coleta que já existia não tem evento próprio; é aqui que o
 *   reenvio dele é reconhecido, para não juntar duas vezes.
 */
export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasColumn = await trx.schema.hasColumn('eventos', 'numero_coleta')
    if (!hasColumn) {
      await trx.schema.alterTable('eventos', table => {
        table.string('numero_coleta', 50).nullable()
      })
      await trx.raw(`
        CREATE UNIQUE INDEX eventos_expedicao_numero_coleta_unique
          ON eventos (expedicao_id, numero_coleta)
          WHERE numero_coleta IS NOT NULL
      `)
    }

    const hasTable = await trx.schema.hasTable('eventos_envios')
    if (!hasTable) {
      await trx.schema.createTable('eventos_envios', table => {
        table.uuid('client_uuid').primary()

        table.integer('evento_id').notNullable()
        table.foreign('evento_id')
          .references('id')
          .inTable('eventos')
          .onDelete('CASCADE')
          .onUpdate('CASCADE')

        table.timestamp('created_at').notNullable().defaultTo(trx.fn.now())

        table.bigInteger('created_by').nullable()
        table.foreign('created_by')
          .references('id')
          .inTable('usuarios')
          .onDelete('NO ACTION')
          .onUpdate('CASCADE')

        table.index('evento_id', 'eventos_envios_evento_id_index')
      })
    }
  })
}
