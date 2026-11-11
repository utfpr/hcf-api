import { Knex } from 'knex'

/**
 * Chave de idempotência gerada pelo app ao salvar offline. Se a rede cair
 * depois do POST dar certo e o app reenviar, o mesmo client_uuid devolve o
 * registro já criado em vez de duplicar.
 *
 * NULL para o que veio de outros clientes (web); o índice único só vale
 * entre os preenchidos.
 */
const TABELAS = [
  'eventos',
  'evidencias',
  'lembretes',
  'lembretes_evidencias'
]

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    for (const tabela of TABELAS) {
      const hasColumn = await trx.schema.hasColumn(tabela, 'client_uuid')
      if (hasColumn) {
        continue
      }

      await trx.schema.alterTable(tabela, table => {
        table.uuid('client_uuid').nullable()
        table.unique(['client_uuid'], { indexName: `${tabela}_client_uuid_unique` })
      })
    }
  })
}
