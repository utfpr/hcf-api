/* eslint-disable */

import { Knex } from 'knex'
import { parseFile } from 'fast-csv'

export async function run(knex: Knex): Promise<void> {
  const updates: Array<{
    HCF: string;
    LOCAL_COLETA: string;
    DESCRICAO_COLETA: string;
  }> = []

  await new Promise<void>((resolve, reject) => {

    parseFile(`${__dirname}/20250827115833_update_locais_coleta/locais_coleta_corrigidos.csv`, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => {
        updates.push(row)
      })
      .on('end', () => resolve())
  })

  await knex.transaction(async trx => {
    for (const update of updates) {
      const { LOCAL_COLETA, DESCRICAO_COLETA } = update
      await trx('locais_coleta').where({ id: LOCAL_COLETA })
        .update({
          descricao: DESCRICAO_COLETA
        })
    }
  })
}
