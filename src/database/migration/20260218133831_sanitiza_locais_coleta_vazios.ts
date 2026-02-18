import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.raw(`
      UPDATE tombos t
      JOIN locais_coleta lc ON lc.id = t.local_coleta_id
      SET t.local_coleta_id = NULL
      WHERE lc.descricao IS NULL OR TRIM(lc.descricao) = ''
    `)

    await trx.raw(`
      DELETE lc
      FROM locais_coleta lc
      LEFT JOIN tombos t ON t.local_coleta_id = lc.id
      WHERE (lc.descricao IS NULL OR TRIM(lc.descricao) = '')
        AND t.hcf IS NULL
    `)
  })
}
