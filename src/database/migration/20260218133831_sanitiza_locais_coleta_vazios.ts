import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.raw(`
      UPDATE tombos
      SET local_coleta_id = NULL
      FROM locais_coleta lc
      WHERE tombos.local_coleta_id = lc.id
        AND (lc.descricao IS NULL OR TRIM(lc.descricao) = '')
    `)

    await trx.raw(`
      DELETE FROM locais_coleta lc
      WHERE (lc.descricao IS NULL OR TRIM(lc.descricao) = '')
        AND NOT EXISTS (
          SELECT 1 FROM tombos t WHERE t.local_coleta_id = lc.id
        )
    `)
  })
}
