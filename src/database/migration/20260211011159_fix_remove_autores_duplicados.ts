import { Knex } from 'knex'

type DupGroupRow = {
  nome: string
  observacao: string | null
  keep_id: number
  drop_ids: number[]
}

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const hasIniciais = await trx.schema.hasColumn('autores', 'iniciais')
    const hasObservacao = await trx.schema.hasColumn('autores', 'observacao')

    if (hasIniciais && !hasObservacao) {
      await trx.schema.alterTable('autores', table => {
        table.renameColumn('iniciais', 'observacao')
      })
    }

    const hasObservacaoNow = await trx.schema.hasColumn('autores', 'observacao')
    if (hasObservacaoNow) {
      await trx.schema.alterTable('autores', table => {
        table.string('observacao', 500).nullable().alter()
      })
    }

    const dupGroups = (await trx('autores')
      .select([
        'nome',
        'observacao',
        trx.raw('MIN(id)::int as keep_id'),
        trx.raw('ARRAY_AGG(id ORDER BY id) as ids'),
        trx.raw('COUNT(*)::int as qtde'),
      ])
      .groupBy(['nome', 'observacao'])
      .havingRaw('COUNT(*) > 1')) as unknown as Array<{
        nome: string
        observacao: string | null
        keep_id: number
        ids: number[]
        qtde: number
      }>

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

    await trx.raw('DROP TABLE IF EXISTS autor_merge')
    await trx.schema.createTable('autor_merge', table => {
      table.integer('keep_id').notNullable()
      table.integer('drop_id').notNullable().primary()
    })

    await trx('autor_merge').insert(pairs)

    await trx.raw(`
      UPDATE especies e
      SET autor_id = m.keep_id
      FROM autor_merge m
      WHERE e.autor_id = m.drop_id
    `)

    await trx.raw(`
      UPDATE sub_especies se
      SET autor_id = m.keep_id
      FROM autor_merge m
      WHERE se.autor_id = m.drop_id
    `)

    await trx.raw(`
      UPDATE variedades v
      SET autor_id = m.keep_id
      FROM autor_merge m
      WHERE v.autor_id = m.drop_id
    `)

    const hasSubFamiliasAutorId = await trx.schema.hasColumn('sub_familias', 'autor_id')
    if (hasSubFamiliasAutorId) {
      await trx.raw(`
        UPDATE sub_familias sf
        SET autor_id = m.keep_id
        FROM autor_merge m
        WHERE sf.autor_id = m.drop_id
      `)
    }

    await trx.raw(`
      DELETE FROM autores a
      USING autor_merge m
      WHERE a.id = m.drop_id
    `)

    await trx.schema.dropTable('autor_merge')
  })
}