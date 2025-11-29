import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx('cidades').where({ nome: 'Não Informado' })
      .del()
    await trx('estados').where({ nome: 'Não Informado' })
      .del()
    await trx('paises').where({ nome: 'Não Informado' })
      .del()

    await trx('paises').where({ sigla: 'OOO' })
      .del()

    await trx('paises').insert({
      nome: 'Não Informado',
      sigla: 'NI'
    })

    const paisesList = await trx('paises')

    for (const pais of paisesList) {
      await trx('estados').insert({
        nome: 'Não Informado',
        sigla: 'NI',
        pais_id: pais.id
      })
    }

    const estadosList = await trx('estados')

    for (const estado of estadosList) {
      await trx('cidades').insert({
        nome: 'Não Informado',
        estado_id: estado.id
      })
    }
  })
}
