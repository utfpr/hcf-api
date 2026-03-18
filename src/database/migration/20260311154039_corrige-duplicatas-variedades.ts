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

export async function run(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    try {
      // 1. Buscamos os Tombos trazendo os nomes REAIS das tabelas de taxonomia via JOIN
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
          'v.nome as variedade_nome', // Nome atual na tabela de variedades
          'f.nome as familia_nome',
          'g.nome as genero_nome',
          'e.nome as especie_nome'
        )
        // Filtramos apenas onde a árvore taxonômica está completa
        .whereNotNull('t.familia_id')
        .whereNotNull('t.genero_id')
        .whereNotNull('t.especie_id')
        .whereNotNull('v.nome') 

      const snapshot: SnapshotItem[] = []
      const variedadesMap = new Map<string, NovaVariedade>()

      // 2. Mapeamos as variedades únicas baseadas na composição visual
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

      // 3. Limpeza: removemos vínculos antigos para evitar erros de FK
      if (tomboIds.length > 0) {
        await trx('tombos')
          .whereIn('hcf', tomboIds)
          .update({ variedade_id: null })
      }

      // 4. Reset da tabela de variedades
      await trx('variedades').del()

      // 5. Inserção das novas variedades normalizadas
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

      // 6. Criamos o mapa de Novos IDs para atualizar os Tombos
      const newIdMap = new Map<string, number>()

      for (const row of inserted) {
        const matchingTombo = tombos.find(
          (t) =>
            Number(t.familia_id) === Number(row.familia_id) &&
            Number(t.genero_id) === Number(row.genero_id) &&
            Number(t.especie_id) === Number(row.especie_id) &&
            normalize(t.variedade_nome) === normalize(row.nome)
        )

        const key = [
          normalize(row.nome),
          normalize(matchingTombo?.familia_nome),
          normalize(matchingTombo?.genero_nome),
          normalize(matchingTombo?.especie_nome),
        ].join('|')

        newIdMap.set(key, Number(row.id))
      }

      // 7. Atualização final dos Tombos com os IDs corretos
      let tombosAtualizados = 0
      for (const item of snapshot) {
        const novaVariedadeId = newIdMap.get(item.key)

        if (novaVariedadeId) {
          const updated = await trx('tombos')
            .where('hcf', item.tomboId)
            .update({ variedade_id: novaVariedadeId })
          
          tombosAtualizados += Number(updated || 0)
        }
      }

      console.log('Migração finalizada com sucesso!')
      console.log(`Variedades recriadas: ${novasVariedades.length}`)
      console.log(`Registros de Tombos corrigidos: ${tombosAtualizados}`)
      
    } catch (error) {
      console.error('Falha na migração. O banco realizou rollback.', error)
      throw error
    }
  })
}
