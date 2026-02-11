import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    const dupGroups = await trx('autores')
      .select([
        'nome',
        'iniciais',
        trx.raw('COUNT(*) as qtde'),
        trx.raw('MIN(id) as keep_id'),
        trx.raw("GROUP_CONCAT(id ORDER BY id SEPARATOR ',') as ids"),
      ])
      .groupBy(['nome', 'iniciais'])
      .havingRaw('COUNT(*) > 1')

    if (!dupGroups.length) return
    const pairs: Array<{ keep_id: number; drop_id: number }> = []
    for (const g of dupGroups as any[]) {
      const keepId = Number(g.keep_id)
      const ids = String(g.ids)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n))

      for (const id of ids) {
        if (id !== keepId) pairs.push({ keep_id: keepId, drop_id: id })
      }
    }

    if (!pairs.length) return
    await trx.raw(`
      DROP TEMPORARY TABLE IF EXISTS autor_merge;
    `)

    await trx.raw(`
      CREATE TEMPORARY TABLE autor_merge (
        keep_id INT NOT NULL,
        drop_id INT NOT NULL,
        PRIMARY KEY (drop_id),
        KEY (keep_id)
      );
    `)
    await trx('autor_merge').insert(pairs)
    await trx.raw(`
      UPDATE especies e
      JOIN autor_merge m ON e.autor_id = m.drop_id
      SET e.autor_id = m.keep_id;
    `)

    await trx.raw(`
      UPDATE sub_especies se
      JOIN autor_merge m ON se.autor_id = m.drop_id
      SET se.autor_id = m.keep_id;
    `)

    await trx.raw(`
      UPDATE variedades v
      JOIN autor_merge m ON v.autor_id = m.drop_id
      SET v.autor_id = m.keep_id;
    `)

    const hasSubFamiliasAutorId = await trx.schema.hasColumn('sub_familias', 'autor_id')
    if (hasSubFamiliasAutorId) {
      await trx.raw(`
        UPDATE sub_familias sf
        JOIN autor_merge m ON sf.autor_id = m.drop_id
        SET sf.autor_id = m.keep_id;
      `)
    }
    const [[rest1]] = await trx.raw(`
      SELECT COUNT(*) AS c
      FROM especies e
      JOIN autor_merge m ON e.autor_id = m.drop_id;
    `)

    const [[rest2]] = await trx.raw(`
      SELECT COUNT(*) AS c
      FROM sub_especies se
      JOIN autor_merge m ON se.autor_id = m.drop_id;
    `)

    const [[rest3]] = await trx.raw(`
      SELECT COUNT(*) AS c
      FROM variedades v
      JOIN autor_merge m ON v.autor_id = m.drop_id;
    `)

    const restantes =
      Number(rest1?.c ?? 0) + Number(rest2?.c ?? 0) + Number(rest3?.c ?? 0)

    if (restantes > 0) {
      throw new Error(`Merge abortado: ainda existem ${restantes} referências para autores duplicados (DROP).`)
    }

    if (hasSubFamiliasAutorId) {
      const [[rest4]] = await trx.raw(`
        SELECT COUNT(*) AS c
        FROM sub_familias sf
        JOIN autor_merge m ON sf.autor_id = m.drop_id;
      `)
      if (Number(rest4?.c ?? 0) > 0) {
        throw new Error(`Merge abortado: ainda existem ${rest4.c} referências em sub_familias para autores duplicados (DROP).`)
      }
    }

    await trx.raw(`
      DELETE a
      FROM autores a
      JOIN autor_merge m ON a.id = m.drop_id;
    `)
  })
}
