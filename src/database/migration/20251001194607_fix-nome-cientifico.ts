<<<<<<< HEAD
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    const tombos = await trx('tombos')
      .select('hcf', 'genero_id', 'especie_id')
      .where('hcf', '>=', 42852)

    const updates = tombos.map(async (tombo) => {
      let nomeCientifico = null

      if (tombo.genero_id) {
        const genero = await trx('generos')
          .select('nome')
          .where('id', tombo.genero_id)
          .first()

        if (genero) {
          nomeCientifico = genero.nome

          if (tombo.especie_id) {
            const especie = await trx('especies')
              .select('nome')
              .where('id', tombo.especie_id)
              .first()

            if (especie) {
              nomeCientifico = `${genero.nome} ${especie.nome}`
            }
          }
        }
      }

      return trx('tombos')
        .where('hcf', tombo.hcf)
        .update({
          nome_cientifico: nomeCientifico
        })
    })

    await Promise.all(updates)
  })
}
=======
import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const tombos = await trx('tombos')
      .select('hcf', 'genero_id', 'especie_id')
      .where('hcf', '>=', 42852)

    const updates = tombos.map(async tombo => {
      let nomeCientifico = null

      if (tombo.genero_id) {
        const genero = await trx('generos')
          .select('nome')
          .where('id', tombo.genero_id)
          .first()

        if (genero) {
          nomeCientifico = genero.nome

          if (tombo.especie_id) {
            const especie = await trx('especies')
              .select('nome')
              .where('id', tombo.especie_id)
              .first()

            if (especie) {
              nomeCientifico = `${genero.nome} ${especie.nome}`
            }
          }
        }
      }

      return trx('tombos')
        .where('hcf', tombo.hcf)
        .update({
          nome_cientifico: nomeCientifico
        })
    })

    await Promise.all(updates)
  })
}
>>>>>>> origin/development
