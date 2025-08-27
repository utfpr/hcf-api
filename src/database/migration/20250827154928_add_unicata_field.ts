import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {

  knex.schema.alterTable('tombos', table => {
    table.boolean('unicata').defaultTo(null).nullable()
  })

  await knex.transaction(async trx => {
    const rows = parseFile(
      `${__dirname}/tombo_exsicata_tipo.csv`,
      { headers: true }
    )

    /* eslint-disable no-restricted-syntax */
    for await (const row of rows) {
      const { id, tombo_tipo: tomboTipo } = row

      await trx('tombos')
        .where({ hcf: id })
        .update({ unicata: tomboTipo === 'UNICATA' ? true : false })
    }
  })
}
