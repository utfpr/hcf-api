import { parseFile } from 'fast-csv'
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.raw(`
      ALTER TABLE tombos 
      ADD COLUMN exsicata_tipo ENUM('UNICATA', 'DUPLICATA') NULL;
    `)

    const rows = parseFile(
      'src/database/20250816024121_add_exsicata_tipo/tombo_exsicata_tipo.csv',
      { headers: true }
    )

    /* eslint-disable no-restricted-syntax */
    for await (const row of rows) {
      const { id, tombo_tipo: tomboTipo } = row

      if (!tomboTipo) return

      await trx('tombos')
        .where({ hcf: id })
        .update({ exsicata_tipo: tomboTipo })
    }
  })
}
