import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE configuracao
      MODIFY hora_inicio TIME NOT NULL,
      MODIFY hora_fim TIME NULL,
      MODIFY data_proxima_atualizacao DATETIME NULL;
  `)
}
