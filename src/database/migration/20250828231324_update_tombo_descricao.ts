/* eslint-disable */

import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const updates: Array<{
    HCF: string;
    OBSERVACAO: string;
  }> = []

  await new Promise<void>((resolve, reject) => {
    parseFile(`${__dirname}/20250828231324_update_tombo_descricao/OBSERVACOES_FIREBIRD.csv`, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => {
        updates.push(row)
      })
      .on('end', () => resolve())
  })

  await knex.transaction(async trx => {
    for (const update of updates) {
      const { HCF, OBSERVACAO } = update
      await trx('tombos').where({ hcf: HCF })
        .update({
          descricao: OBSERVACAO
        })
    }
  })
}
