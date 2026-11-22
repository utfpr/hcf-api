import { type Knex } from 'knex'

type Cidade = { id: number }
type LocalColetaRecord = { id: number | string }

export async function insertLocalColetaCidade(knex: Knex): Promise<{
  id: number
  cleanup: () => Promise<void>
}> {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1e6)}`
  const [pais] = await knex('paises')
    .insert({
      nome: `Pais CRUD ${suffix}`,
      sigla: `P${suffix.slice(-3)}`
    })
    .returning<Cidade[]>('id')
  const [estado] = await knex('estados')
    .insert({
      nome: `Estado CRUD ${suffix}`,
      sigla: `E${suffix.slice(-3)}`,
      pais_id: pais.id
    })
    .returning<Cidade[]>('id')
  const [cidade] = await knex('cidades')
    .insert({
      nome: `Cidade CRUD ${suffix}`,
      estado_id: estado.id
    })
    .returning<Cidade[]>('id')

  return {
    id: Number(cidade.id),
    cleanup: async () => {
      await knex('cidades').where({ id: cidade.id }).delete()
      await knex('estados').where({ id: estado.id }).delete()
      await knex('paises').where({ id: pais.id }).delete()
    }
  }
}

export async function insertLocalColeta(
  knex: Knex,
  cidadeId: number,
  descricao: string,
  faseId?: number
): Promise<string> {
  const [localColeta] = await knex('locais_coleta')
    .insert({
      descricao,
      cidade_id: cidadeId,
      fase_sucessional_id: faseId ?? null
    })
    .returning<LocalColetaRecord[]>('id')
  return String(localColeta.id)
}
