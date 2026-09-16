import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  const hasNumero = await knex.schema.hasColumn('fase_sucessional', 'numero')
  const hasId = await knex.schema.hasColumn('fase_sucessional', 'id')

  if (hasNumero && !hasId) {
    await knex.schema.alterTable('fase_sucessional', table => {
      table.renameColumn('numero', 'id')
    })
  }

  await knex.raw(`
    CREATE SEQUENCE IF NOT EXISTS fase_sucessional_id_seq;
  `)

  await knex.raw(`
    SELECT setval(
      'fase_sucessional_id_seq',
      COALESCE((SELECT MAX(id) FROM fase_sucessional), 1),
      true
    );
  `)

  await knex.raw(`
    ALTER TABLE fase_sucessional
    ALTER COLUMN id SET DEFAULT nextval('fase_sucessional_id_seq');
  `)

  await knex.raw(`
    ALTER SEQUENCE fase_sucessional_id_seq
    OWNED BY fase_sucessional.id;
  `)
}
