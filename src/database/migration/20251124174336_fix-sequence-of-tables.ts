import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const tables = await trx('information_schema.columns')
      .select('table_name')
      .where({
        column_name: 'id',
        table_schema: 'public'
      })

    for (const row of tables) {
      const table = row.table_name
      const sequence = `${table}_id_seq`

      await trx.raw(`
        CREATE SEQUENCE IF NOT EXISTS ${sequence};
      `)

      const [{ max }] = await trx(table).max('id as max')

      const startValue = max && Number(max) > 0 ? Number(max) : 1

      await trx.raw(`
        SELECT setval('${sequence}', ${startValue});
      `)

      await trx.raw(`
        ALTER TABLE ${table}
        ALTER COLUMN id SET DEFAULT nextval('${sequence}');
      `)

      await trx.raw(`
        ALTER SEQUENCE ${sequence}
        OWNED BY ${table}.id;
      `)
    }
  })
}
