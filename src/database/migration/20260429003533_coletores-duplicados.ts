import { Knex } from 'knex'

type DupGroupRow = {
  nome_norm: string
  keep_id: number
  ids: number[]
  qtde: number
}

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // Agrupa por nome normalizado; prefere o registro com e-mail, depois o menor id
    const dupGroups = (await trx('coletores')
      .select([
        trx.raw("TRIM(LOWER(nome)) as nome_norm"),
        trx.raw(`COALESCE(
          MIN(id) FILTER (WHERE email IS NOT NULL AND email <> ''),
          MIN(id)
        )::int as keep_id`),
        trx.raw('ARRAY_AGG(id ORDER BY id) as ids'),
        trx.raw('COUNT(*)::int as qtde'),
      ])
      .groupByRaw('TRIM(LOWER(nome))')
      .havingRaw('COUNT(*) > 1')) as unknown as DupGroupRow[]

    if (!dupGroups.length) return

    const pairs: Array<{ keep_id: number; drop_id: number }> = []

    for (const g of dupGroups) {
      const keepId = Number(g.keep_id)
      const ids = (g.ids ?? []).map(n => Number(n)).filter(Number.isFinite)

      for (const id of ids) {
        if (id !== keepId) pairs.push({ keep_id: keepId, drop_id: id })
      }
    }

    if (!pairs.length) return

    await trx.raw('DROP TABLE IF EXISTS coletor_merge')

    await trx.schema.createTable('coletor_merge', table => {
      table.integer('keep_id').notNullable()
      table.integer('drop_id').notNullable().primary()
    })

    await trx('coletor_merge').insert(pairs)

    // Atualiza tombos.coletor_id
    await trx.raw(`
      UPDATE tombos t
      SET coletor_id = m.keep_id
      FROM coletor_merge m
      WHERE t.coletor_id = m.drop_id
    `)

    // tombos_coletores tem PK composta (tombo_hcf, coletor_id) — só opera se a tabela existir
    const hasTombosColetores = await trx.schema.hasTable('tombos_coletores')

    if (hasTombosColetores) {
      // Remove linhas que já existem com keep_id para o mesmo tombo (evita conflito de PK)
      await trx.raw(`
        DELETE FROM tombos_coletores tc
        USING coletor_merge m
        WHERE tc.coletor_id = m.drop_id
          AND EXISTS (
            SELECT 1 FROM tombos_coletores tc2
            WHERE tc2.tombo_hcf = tc.tombo_hcf
              AND tc2.coletor_id = m.keep_id
          )
      `)

      // Atualiza as linhas restantes em tombos_coletores
      await trx.raw(`
        UPDATE tombos_coletores tc
        SET coletor_id = m.keep_id
        FROM coletor_merge m
        WHERE tc.coletor_id = m.drop_id
      `)
    }

    // Remove os coletores duplicados
    await trx.raw(`
      DELETE FROM coletores c
      USING coletor_merge m
      WHERE c.id = m.drop_id
    `)

    await trx.schema.dropTable('coletor_merge')
  })
}
