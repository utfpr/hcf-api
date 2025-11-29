import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx('coletores').where({
      id: 338
    }).del()

    await trx('coletores').where({
      id: 145
    }).del()

    await trx('coletores').where({
      id: 525
    }).del()
  })
}
