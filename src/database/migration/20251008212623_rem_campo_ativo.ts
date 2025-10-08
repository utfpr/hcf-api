import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const tabelas = [
      'autores',
      'coletores',
      'especies',
      'familias',
      'generos',
      'herbarios',
      'sub_especies',
      'sub_familias',
      'telefones',
      'tombos_fotos',
      'usuarios',
      'variedades'
    ]

    await Promise.all(
      tabelas.map(async tabela => {
        const hasColumn = await trx.schema.hasColumn(tabela, 'ativo')
        if (hasColumn) {
          await trx.schema.alterTable(tabela, table => {
            table.dropColumn('ativo')
          })
        }
      })
    )
  })
}
