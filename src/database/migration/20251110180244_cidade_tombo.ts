import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasCol = await trx.schema.hasColumn('tombos', 'cidade_id')
    if (!hasCol) {
      await trx.schema.alterTable('tombos', table => {
        table.integer('cidade_id').unsigned().nullable().index()
      })
    } else {
      await trx.raw('ALTER TABLE `tombos` MODIFY `cidade_id` INT UNSIGNED NULL')
    }

    await trx.schema.alterTable('tombos', table => {
      table
        .foreign('cidade_id', 'fk_tombos_cidade')
        .references('cidades.id')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
    })

    await trx.raw(`
      UPDATE tombos t
      JOIN locais_coleta lc ON lc.id = t.local_coleta_id
      SET t.cidade_id = lc.cidade_id
      WHERE t.local_coleta_id IS NOT NULL
        AND (t.cidade_id IS NULL OR t.cidade_id = 0)
    `)
  })
}
