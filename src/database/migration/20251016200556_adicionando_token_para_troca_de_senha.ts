import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.schema.alterTable('usuarios', table => {
    table.string('token_troca_senha').nullable()
    table.timestamp('token_troca_senha_expiracao').nullable()
  })
}
