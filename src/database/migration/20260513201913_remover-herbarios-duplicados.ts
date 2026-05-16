import { Knex } from 'knex'

type DupGroupRow = {
  nome_norm: string
  sigla_norm: string
  keep_id: number
  ids: number[]
  qtde: number
}

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // Agrupa por nome e sigla normalizados; mantém o menor id
    const dupGroups = (await trx('herbarios')
      .select([
        trx.raw('TRIM(LOWER(nome)) as nome_norm'),
        trx.raw('TRIM(LOWER(COALESCE(sigla, \'\'))) as sigla_norm'),
        trx.raw('MIN(id)::int as keep_id'),
        trx.raw('ARRAY_AGG(id ORDER BY id) as ids'),
        trx.raw('COUNT(*)::int as qtde')
      ])
      .groupByRaw('TRIM(LOWER(nome)), TRIM(LOWER(COALESCE(sigla, \'\')))')
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

    await trx.raw('DROP TABLE IF EXISTS herbario_merge')

    await trx.schema.createTable('herbario_merge', table => {
      table.integer('keep_id').notNullable()
      table.integer('drop_id').notNullable().primary()
    })

    await trx('herbario_merge').insert(pairs)

    // Atualiza tombos.entidade_id
    await trx.raw(`
      UPDATE tombos t
      SET entidade_id = m.keep_id
      FROM herbario_merge m
      WHERE t.entidade_id = m.drop_id
    `)

    // Atualiza remessas
    await trx.raw(`
      UPDATE remessas r
      SET herbario_id = m.keep_id
      FROM herbario_merge m
      WHERE r.herbario_id = m.drop_id
    `)

    await trx.raw(`
      UPDATE remessas r
      SET entidade_destino_id = m.keep_id
      FROM herbario_merge m
      WHERE r.entidade_destino_id = m.drop_id
    `)

    // Atualiza usuarios.herbario_id
    await trx.raw(`
      UPDATE usuarios u
      SET herbario_id = m.keep_id
      FROM herbario_merge m
      WHERE u.herbario_id = m.drop_id
    `)

    // Remove os herbários duplicados
    await trx.raw(`
      DELETE FROM herbarios h
      USING herbario_merge m
      WHERE h.id = m.drop_id
    `)

    await trx.schema.dropTable('herbario_merge')
  })
}
