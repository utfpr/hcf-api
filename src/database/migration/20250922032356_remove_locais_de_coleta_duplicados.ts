import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // 1) Atualiza tombos -> id canônico
    await trx.raw(
      `
      WITH normalized AS (
        SELECT
          id,
          cidade_id,
          COALESCE(NULLIF(TRIM(descricao), ''), '') AS desc_key
        FROM locais_coleta
      ),
      canon AS (
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
          c.keep_id
        FROM normalized n
        JOIN canon c
          ON c.cidade_id = n.cidade_id
         AND c.desc_key  = n.desc_key
        WHERE n.id <> c.keep_id
      )
      UPDATE tombos t
      JOIN to_fix f
        ON t.local_coleta_id = f.old_id
      SET t.local_coleta_id = f.keep_id;
      `
    )

    // 2) Deleta locais não canônicos
    await trx.raw(
      `
      WITH normalized AS (
        SELECT
          id,
          cidade_id,
          COALESCE(NULLIF(TRIM(descricao), ''), '') AS desc_key
        FROM locais_coleta
      ),
      canon AS (
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
          n.id AS old_id
        FROM normalized n
        JOIN canon c
          ON c.cidade_id = n.cidade_id
         AND c.desc_key  = n.desc_key
        WHERE n.id <> c.keep_id
      )
      DELETE lc
      FROM locais_coleta lc
      JOIN to_fix f
        ON lc.id = f.old_id;
      `
    )
  })
}
