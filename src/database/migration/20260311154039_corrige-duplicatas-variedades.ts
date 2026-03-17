import { Knex } from 'knex'

function normalize(value: unknown): string {
  return String(value ?? '')
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
}

export async function up(knex: Knex): Promise<void> {
  const trx = await knex.transaction()

  try {
    const tombos = await trx('tombos as t')
      .select(
        't.hcf as tombo_id',
        't.familia_id',
        't.genero_id',
        't.especie_id',
        't.variedade_nome as variedade_nome',
        't.familia_nome as familia_nome',
        't.genero_nome as genero_nome',
        't.especie_nome as especie_nome'
      )
      .whereNotNull('t.variedade_nome')
      .whereNotNull('t.familia_nome')
      .whereNotNull('t.genero_nome')
      .whereNotNull('t.especie_nome')
      .whereNotNull('t.familia_id')
      .whereNotNull('t.genero_id')
      .whereNotNull('t.especie_id')

    const snapshot: SnapshotItem[] = []
    const variedadesMap = new Map<string, NovaVariedade>()

    for (const row of tombos) {
      const key = [
        normalize(row.variedade_nome),
        normalize(row.familia_nome),
        normalize(row.genero_nome),
        normalize(row.especie_nome),
      ].join('|')

      snapshot.push({
        tomboId: Number(row.tombo_id),
        key,
      })

      if (!variedadesMap.has(key)) {
        variedadesMap.set(key, {
          key,
          nome: String(row.variedade_nome).trim(),
          familia_id: Number(row.familia_id),
          genero_id: Number(row.genero_id),
          especie_id: Number(row.especie_id),
        })
      }
    }

    const novasVariedades = Array.from(variedadesMap.values())

    const tomboIds = snapshot.map((item) => item.tomboId)

    if (tomboIds.length > 0) {
      await trx('tombos')
        .whereIn('hcf', tomboIds)
        .update({ variedade_id: null })
    }

    await trx('variedades').del()

    const inserted = await trx('variedades')
      .insert(
        novasVariedades.map((item) => ({
          nome: item.nome,
          familia_id: item.familia_id,
          genero_id: item.genero_id,
          especie_id: item.especie_id,
        }))
      )
      .returning(['id', 'nome', 'familia_id', 'genero_id', 'especie_id'])

    const newIdMap = new Map<string, number>()

    for (const row of inserted as Array<{
      id: number
      nome: string
      familia_id: number
      genero_id: number
      especie_id: number
    }>) {
      const key = [
        normalize(row.nome),
        normalize(
          tombos.find(
            (t) =>
              Number(t.familia_id) === Number(row.familia_id) &&
              Number(t.genero_id) === Number(row.genero_id) &&
              Number(t.especie_id) === Number(row.especie_id) &&
              normalize(t.variedade_nome) === normalize(row.nome)
          )?.familia_nome
        ),
        normalize(
          tombos.find(
            (t) =>
              Number(t.familia_id) === Number(row.familia_id) &&
              Number(t.genero_id) === Number(row.genero_id) &&
              Number(t.especie_id) === Number(row.especie_id) &&
              normalize(t.variedade_nome) === normalize(row.nome)
          )?.genero_nome
        ),
        normalize(
          tombos.find(
            (t) =>
              Number(t.familia_id) === Number(row.familia_id) &&
              Number(t.genero_id) === Number(row.genero_id) &&
              Number(t.especie_id) === Number(row.especie_id) &&
              normalize(t.variedade_nome) === normalize(row.nome)
          )?.especie_nome
        ),
      ].join('|')

      newIdMap.set(key, Number(row.id))
    }

    let tombosAtualizados = 0

    for (const item of snapshot) {
      const novaVariedadeId = newIdMap.get(item.key)

      if (!novaVariedadeId) {
        throw new Error(`Nao foi possivel encontrar nova variedade para o tombo ${item.tomboId}`)
      }

      const updated = await trx('tombos')
        .where('hcf', item.tomboId)
        .update({ variedade_id: novaVariedadeId })

      tombosAtualizados += Number(updated || 0)
    }

    await trx.commit()

    console.log('Migracao concluida com sucesso')
    console.log(`Tombos processados: ${snapshot.length}`)
    console.log(`Variedades recriadas: ${novasVariedades.length}`)
    console.log(`Tombos atualizados: ${tombosAtualizados}`)
  } catch (error) {
    await trx.rollback()
    console.error('Erro na migracao. Rollback executado.', error)
    throw error
  }
}

export async function down(): Promise<void> {
  console.log('Migracao irreversivel: down nao implementado.')
}
