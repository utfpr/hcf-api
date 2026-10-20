import { Knex } from 'knex'

/**
 * Expedição de onde o lembrete foi criado, para a tela da expedição mostrar só
 * os lembretes dela.
 *
 * Opcional: lembretes antigos e os criados fora de uma expedição ficam sem. Se a
 * expedição for apagada o lembrete continua valendo (é para voltar a coletar),
 * só perde a ligação.
 */
export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasColumn = await trx.schema.hasColumn('lembretes', 'expedicao_id')
    if (hasColumn) {
      return
    }

    await trx.schema.alterTable('lembretes', table => {
      table.integer('expedicao_id').nullable()
      table.foreign('expedicao_id')
        .references('id')
        .inTable('expedicoes')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')

      table.index('expedicao_id', 'lembretes_expedicao_id_index')
    })
  })
}
