import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // Atualiza tombos que possuem genero e especie
    await trx.raw(`
      UPDATE tombos
      SET nome_cientifico = CONCAT(g.nome, ' ', e.nome)
      FROM generos g, especies e
      WHERE tombos.genero_id = g.id
        AND tombos.especie_id = e.id
        AND (
          tombos.nome_cientifico IS DISTINCT FROM CONCAT(g.nome, ' ', e.nome)
          OR e.genero_id IS DISTINCT FROM tombos.genero_id
        )
    `)

    // Atualiza tombos que possuem apenas genero (sem especie)
    await trx.raw(`
      UPDATE tombos
      SET nome_cientifico = g.nome
      FROM generos g
      WHERE tombos.genero_id = g.id
        AND tombos.especie_id IS NULL
        AND tombos.nome_cientifico IS DISTINCT FROM g.nome
    `)
  })
}
