import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.schema.table('coletores', table => {
    table.dropColumn('numero')
  })

  await knex.schema.table('tombos', table => {
    table.index(['coletor_id', 'numero_coleta'], 'idx_tombos_coletor_id_numero_coleta')
  })
}
