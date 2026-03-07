import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.schema.alterTable('alteracoes', table => {
      table.smallint('ativo_backup').nullable()
      table.smallint('identificacao_backup').nullable()
    })

    await trx.raw('UPDATE alteracoes SET ativo_backup = ativo, identificacao_backup = identificacao')

    await trx.schema.alterTable('alteracoes', table => {
      table.dropColumn('ativo')
      table.dropColumn('identificacao')
    })

    await trx.schema.alterTable('alteracoes', table => {
      table.boolean('ativo').nullable()
      table.boolean('identificacao').nullable()
    })

    await trx.raw('UPDATE alteracoes SET ativo = (ativo_backup = 1), identificacao = (identificacao_backup = 1)')

    await trx.schema.alterTable('alteracoes', table => {
      table.dropColumn('ativo_backup')
      table.dropColumn('identificacao_backup')
    })
  })
}
