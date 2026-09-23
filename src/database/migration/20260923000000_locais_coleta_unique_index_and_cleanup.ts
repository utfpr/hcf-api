import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    await trx.raw(`
      WITH normalized AS (
        SELECT
          id,
          cidade_id,
          NULLIF(TRIM(descricao), '') AS desc_key
        FROM locais_coleta
        WHERE descricao IS NOT NULL
      ),
      duplicate_groups AS (
        SELECT
          cidade_id,
          desc_key,
          MIN(id) AS keep_id
        FROM normalized
        GROUP BY cidade_id, desc_key
        HAVING COUNT(*) > 1
      ),
      to_fix AS (
        SELECT
          n.id AS old_id,
          d.keep_id
        FROM normalized n
        JOIN duplicate_groups d
          ON d.cidade_id = n.cidade_id
         AND d.desc_key = n.desc_key
        WHERE n.id <> d.keep_id
      )
      UPDATE tombos t
      SET local_coleta_id = f.keep_id
      FROM to_fix f
      WHERE t.local_coleta_id = f.old_id
    `)

    await trx.raw(`
      WITH normalized AS (
        SELECT
          id,
          cidade_id,
          NULLIF(TRIM(descricao), '') AS desc_key
        FROM locais_coleta
        WHERE descricao IS NOT NULL
      ),
      duplicate_groups AS (
        SELECT
          cidade_id,
          desc_key,
          MIN(id) AS keep_id
        FROM normalized
        GROUP BY cidade_id, desc_key
        HAVING COUNT(*) > 1
      ),
      to_remove AS (
        SELECT
          n.id
        FROM normalized n
        JOIN duplicate_groups d
          ON d.cidade_id = n.cidade_id
         AND d.desc_key = n.desc_key
        WHERE n.id <> d.keep_id
      )
      DELETE FROM locais_coleta lc
      USING to_remove r
      WHERE lc.id = r.id
    `)

    await trx.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_locais_coleta_cidade_descricao
      ON locais_coleta (cidade_id, LOWER(TRIM(descricao)))
      WHERE descricao IS NOT NULL AND TRIM(descricao) <> ''
    `)
  })
}
