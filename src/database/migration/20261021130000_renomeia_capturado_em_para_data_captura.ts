import { Knex } from 'knex'

/**
 * Os commits que trocaram capturado_em por data_captura editaram as migrações de
 * criação (eventos, evidências e evidências de lembrete). Um banco criado do zero já
 * nasce com data_captura, mas um banco em que essas migrações já tinham rodado ficou
 * com capturado_em, e a API passou a falhar ao listar eventos e evidências.
 *
 * Renomeia só onde ainda estiver o nome antigo: em banco novo não faz nada.
 */
const TABELAS = [
  'eventos',
  'evidencias',
  'lembretes_evidencias'
]

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    for (const tabela of TABELAS) {
      const temAntiga = await trx.schema.hasColumn(tabela, 'capturado_em')
      const temNova = await trx.schema.hasColumn(tabela, 'data_captura')
      if (temAntiga && !temNova) {
        await trx.schema.alterTable(tabela, table => {
          table.renameColumn('capturado_em', 'data_captura')
        })
      }
    }

    await trx.raw('ALTER INDEX IF EXISTS eventos_capturado_em_index RENAME TO eventos_data_captura_index')
  })
}
