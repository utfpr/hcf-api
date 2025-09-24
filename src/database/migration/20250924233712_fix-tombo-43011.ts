import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx('tombos')
      .where({ hcf: 43011 })
      .update({ latitude: -24.528 })
  })
}
