import { Knex } from 'knex'

function normalize(value: unknown): string {
  const safeValue = typeof value === 'string' || typeof value === 'number' ? String(value) : ''

  return safeValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

type SnapshotItem = {
  tomboId: number
  key: string
}

type NovaVariedade = {
  key: string
  nome: string
  familia_id: number
  genero_id: number
  especie_id: number
  autor_id: number | null
}

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const tombos = await trx('tombos as t')
      .join('familias as f', 't.familia_id', 'f.id')
      .join('generos as g', 't.genero_id', 'g.id')
      .join('especies as e', 't.especie_id', 'e.id')
      .leftJoin('variedades as v', 't.variedade_id', 'v.id')
      .select(
        't.hcf as tombo_id',
        't.familia_id',
        't.genero_id',
        't.especie_id',
        'v.nome as variedade_nome',
        'v.autor_id as variedade_autor_id',
        'f.nome as familia_nome',
        'g.nome as genero_nome',
        'e.nome as especie_nome'
      )
      .whereNotNull('t.familia_id')
      .whereNotNull('t.genero_id')
      .whereNotNull('t.especie_id')
      .whereNotNull('v.nome')

    const snapshot: SnapshotItem[] = []
    const variedadesMap = new Map<string, NovaVariedade>()

    for (const row of tombos) {
      const key = [
        normalize(row.variedade_nome),
        normalize(row.familia_nome),
        normalize(row.genero_nome),
        normalize(row.especie_nome),
        row.variedade_autor_id
      ].join('|')

      snapshot.push({
        tomboId: Number(row.tombo_id),
        key
      })

      if (!variedadesMap.has(key)) {
        variedadesMap.set(key, {
          key,
          nome: String(row.variedade_nome).trim(),
          familia_id: Number(row.familia_id),
          genero_id: Number(row.genero_id),
          especie_id: Number(row.especie_id),
          autor_id: row.variedade_autor_id ? Number(row.variedade_autor_id) : null
        })
      }
    }

    const novasVariedades = Array.from(variedadesMap.values())
    const tomboIds = snapshot.map(item => item.tomboId)

    if (tomboIds.length > 0) {
      await trx('tombos')
        .whereIn('hcf', tomboIds)
        .update({ variedade_id: null })
    }

    await trx('variedades').del()

    const inserted = await trx('variedades')
      .insert(
        novasVariedades.map(item => ({
          nome: item.nome,
          familia_id: item.familia_id,
          genero_id: item.genero_id,
          especie_id: item.especie_id,
          autor_id: item.autor_id
        }))
      )
      .returning([
        'id',
        'nome',
        'familia_id',
        'genero_id',
        'especie_id',
        'autor_id'
      ])

    const newIdMap = new Map<string, number>()

    for (const row of inserted) {
      const matchingTombo = tombos.find(
        t =>
          Number(t.familia_id) === Number(row.familia_id)
          && Number(t.genero_id) === Number(row.genero_id)
          && Number(t.especie_id) === Number(row.especie_id)
          && normalize(t.variedade_nome) === normalize(row.nome)
          && (t.variedade_autor_id ? Number(t.variedade_autor_id) : null) === (row.autor_id ? Number(row.autor_id) : null)
      )

      const key = [
        normalize(row.nome),
        normalize(matchingTombo?.familia_nome),
        normalize(matchingTombo?.genero_nome),
        normalize(matchingTombo?.especie_nome),
        row.autor_id ? Number(row.autor_id) : null
      ].join('|')

      newIdMap.set(key, Number(row.id))
    }

    for (const item of snapshot) {
      const novaVariedadeId = newIdMap.get(item.key)

      if (novaVariedadeId) {
        await trx('tombos')
          .where('hcf', item.tomboId)
          .update({ variedade_id: novaVariedadeId })
      }
    }
  })
}
