import { Knex } from 'knex'

/**
 * Tipo de usuário de campo: escreve eventos, lembretes e evidências nas
 * expedições de que participa e só lê o resto. O id é fixo (4) porque as
 * regras de autorização da API, do painel e do app o referenciam diretamente.
 */
export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx('tipos_usuarios')
      .insert({ id: 4, tipo: 'EXPEDICIONARIO' })
      .onConflict('id')
      .ignore()

    await trx.raw(`
      SELECT setval(
        pg_get_serial_sequence('tipos_usuarios', 'id'),
        GREATEST((SELECT MAX(id) FROM tipos_usuarios), 4)
      )
    `)
  })
}
