import { Knex } from 'knex';

export async function run(knex: Knex): Promise<void> {
  await knex.schema.alterTable('usuarios', table => {
    table.string('reset_token').nullable();
    table.timestamp('reset_token_expiration').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('usuarios', table => {
    table.dropColumn('reset_token');
    table.dropColumn('reset_token_expiration');
  });
}
