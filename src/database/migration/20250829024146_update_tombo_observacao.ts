/* eslint-disable */

import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const updates: Array<{
    HCF: string;
    OBS_TOMBO: string;
  }> = []

  await new Promise<void>((resolve, reject) => {
    parseFile(`${__dirname}/20250829024146_update_tombo_observacao/OBS_TOMBO_FIREBIRD.csv`, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => {
        updates.push(row)
      })
      .on('end', () => resolve())
  })

  await knex.transaction(async trx => {
    for (const update of updates) {
      const { HCF, OBS_TOMBO } = update
      await trx('tombos').where({ hcf: HCF })
        .update({
          observacao: OBS_TOMBO
        })
    }
  })
}
