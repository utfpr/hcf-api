import { Knex } from 'knex'

/**
 * Descrição livre e coordenadas do lembrete, para o card mostrar onde voltar a
 * coletar sem depender do texto de local_coleta. Todas opcionais: os lembretes
 * antigos ficam sem.
 */
export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasColumn = await trx.schema.hasColumn('lembretes', 'descricao')
    if (hasColumn) {
      return
    }

    await trx.schema.alterTable('lembretes', table => {
      table.text('descricao').nullable()
      table.double('latitude').nullable()
      table.double('longitude').nullable()
    })
  })
}
