import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {

  knex.schema.alterTable('tombos', table => {
    table.enu('exsicata_tipo', ['UNICATA', 'DUPLICATA']).nullable()
  })

  await knex.transaction(async trx => {
    const rows = parseFile(
      `${__dirname}/tombo/exsicata_tipo.csv`,
      { headers: true }
    )

    /* eslint-disable no-restricted-syntax */
    for await (const row of rows) {
      const { id, tombo_tipo: tomboTipo } = row

      await trx('tombos')
        .where({ hcf: id })
        .update({ exsicata_tipo: tomboTipo })
    }
  })
}
