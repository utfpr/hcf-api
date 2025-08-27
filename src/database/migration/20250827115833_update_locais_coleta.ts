/* eslint-disable */

import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const updates: Array<{
    HCF: string;
    LOCAL_COLETA: string;
    DESCRICAO_COLETA: string;
  }> = []

  await new Promise<void>((resolve, reject) => {
    parseFile(`${__dirname}/locais_coleta_corrigidos.csv`, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => {
        updates.push(row)
      })
      .on('end', () => resolve())
  })

  console.log(updates.length)

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
