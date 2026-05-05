import { Knex } from 'knex'

function normalize(str: string | null | undefined) {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    // 1. BUSCA OS DADOS CONFORME ESTÃO NO TOMBO
    const tombos = await trx('tombos as t')
      .join('familias as f', 't.familia_id', 'f.id')
      .join('generos as g', 't.genero_id', 'g.id')
      .join('especies as e', 't.especie_id', 'e.id')
      .join('sub_especies as sub', 't.sub_especie_id', 'sub.id')
      .select(
        't.hcf as tombo_id',
        't.familia_id',
        't.genero_id',
        't.especie_id', // Esta é a espécie que manda na reconstrução
        'sub.nome as sub_nome',
        'sub.autor_id as sub_autor_id',
        'f.nome as familia_nome',
        'g.nome as genero_nome',
        'e.nome as especie_nome'
      )
      .whereNotNull('t.familia_id')
      .whereNotNull('t.genero_id')
      .whereNotNull('t.especie_id')
      .whereNotNull('sub.nome')
      .where('sub.nome', '<>', '')
      .whereRaw('TRIM(sub.nome) <> \'\'')

    type NovaSubespecie = {
      key: string
      nome: string
      familia_id: number
      genero_id: number
      especie_id: number
      autor_id: number | null
    }

    const uniqueSubespecies = new Map<string, NovaSubespecie>()
    const tombosToUpdate = new Map<string, number[]>()

    for (const row of tombos) {
      const key = [
        normalize(row.sub_nome),
        normalize(row.familia_nome),
        normalize(row.genero_nome),
        normalize(row.especie_nome),
        row.sub_autor_id
      ].join('|')

      if (!uniqueSubespecies.has(key)) {
        uniqueSubespecies.set(key, {
          key,
          nome: row.sub_nome,
          familia_id: row.familia_id,
          genero_id: row.genero_id,
          especie_id: row.especie_id, // Vincula à espécie definida no tombo
          autor_id: row.sub_autor_id
        })
      }

      if (!tombosToUpdate.has(key)) {
        tombosToUpdate.set(key, [])
      }
      tombosToUpdate.get(key)!.push(row.tombo_id)
    }

    const chunkSize = 1000

    // 2. RESET E RECONSTRUÇÃO TOTAL
    // Desconecta todos os tombos antes de apagar a tabela antiga
    await trx('tombos')
      .whereNotNull('sub_especie_id')
      .update({ sub_especie_id: null })

    // Limpa a tabela antiga
    await trx('sub_especies').del()

    if (uniqueSubespecies.size > 0) {
      const itemsToInsert = Array.from(uniqueSubespecies.values()).map(sub => ({
        nome: sub.nome,
        familia_id: sub.familia_id,
        genero_id: sub.genero_id,
        especie_id: sub.especie_id,
        autor_id: sub.autor_id
      }))

      for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
        const chunk = itemsToInsert.slice(i, i + chunkSize)
        await trx('sub_especies').insert(chunk)
      }

      // 3. REATRIBUIÇÃO DOS NOVOS IDS
      const newSubEspecies = await trx('sub_especies as sub')
        .join('familias as f', 'sub.familia_id', 'f.id')
        .join('generos as g', 'sub.genero_id', 'g.id')
        .join('especies as e', 'sub.especie_id', 'e.id')
        .select(
          'sub.id',
          'sub.nome as sub_nome',
          'sub.autor_id as sub_autor_id',
          'f.nome as familia_nome',
          'g.nome as genero_nome',
          'e.nome as especie_nome'
        )

      const newIdMap = new Map<string, number>()
      for (const row of newSubEspecies) {
        const key = [
          normalize(row.sub_nome),
          normalize(row.familia_nome),
          normalize(row.genero_nome),
          normalize(row.especie_nome),
          row.sub_autor_id
        ].join('|')
        newIdMap.set(key, row.id)
      }

      for (const [key, tomboIds] of tombosToUpdate.entries()) {
        const newId = newIdMap.get(key)
        if (newId !== undefined && tomboIds.length > 0) {
          for (let i = 0; i < tomboIds.length; i += chunkSize) {
            const chunk = tomboIds.slice(i, i + chunkSize)
            await trx('tombos')
              .whereIn('hcf', chunk)
              .update({ sub_especie_id: newId })
          }
        }
      }
    }
  })
}
