import type { Knex } from 'knex'

const PREFIXO = 'XEXP'

export interface ExpedicaoFixtures {
  cidades: number[]
  usuarios: number[]
  herbarioId: number
  tipoUsuarioId: number
  estadoId: number
  paisId: number
}

export async function seedExpedicaoFixtures(knex: Knex): Promise<ExpedicaoFixtures> {
  const [pais] = await knex('paises')
    .insert({ nome: `${PREFIXO} Brasil`, sigla: 'XEXB' })
    .returning<Array<{ id: number }>>(['id'])

  const [estado] = await knex('estados')
    .insert({
      nome: `${PREFIXO} Paraná`, sigla: 'XEXP', pais_id: pais.id
    })
    .returning<Array<{ id: number }>>(['id'])

  const cidades = await knex('cidades')
    .insert([
      { nome: `${PREFIXO} Curitiba`, estado_id: estado.id },
      { nome: `${PREFIXO} Londrina`, estado_id: estado.id },
      { nome: `${PREFIXO} Maringá`, estado_id: estado.id }
    ])
    .returning<Array<{ id: number }>>(['id'])

  const [herbario] = await knex('herbarios')
    .insert({ nome: `${PREFIXO} Herbário`, sigla: 'XEXPH' })
    .returning<Array<{ id: number }>>(['id'])

  const [tipoUsuario] = await knex('tipos_usuarios')
    .insert({ tipo: `${PREFIXO} Curador` })
    .returning<Array<{ id: number }>>(['id'])

  const usuarios = await knex('usuarios')
    .insert([
      {
        nome: `${PREFIXO} Ana`,
        email: 'xexp.ana@example.test',
        senha: 'x',
        tipo_usuario_id: tipoUsuario.id,
        herbario_id: herbario.id
      },
      {
        nome: `${PREFIXO} Bruno`,
        email: 'xexp.bruno@example.test',
        senha: 'x',
        tipo_usuario_id: tipoUsuario.id,
        herbario_id: herbario.id
      }
    ])
    .returning<Array<{ id: number }>>(['id'])

  return {
    cidades: cidades.map(cidade => Number(cidade.id)),
    usuarios: usuarios.map(usuario => Number(usuario.id)),
    herbarioId: Number(herbario.id),
    tipoUsuarioId: Number(tipoUsuario.id),
    estadoId: Number(estado.id),
    paisId: Number(pais.id)
  }
}

export async function cleanupExpedicaoFixtures(knex: Knex, fixtures: ExpedicaoFixtures): Promise<void> {
  await knex('usuarios').whereIn('id', fixtures.usuarios).delete()
  await knex('tipos_usuarios').where({ id: fixtures.tipoUsuarioId }).delete()
  await knex('herbarios').where({ id: fixtures.herbarioId }).delete()
  await knex('cidades').whereIn('id', fixtures.cidades).delete()
  await knex('estados').where({ id: fixtures.estadoId }).delete()
  await knex('paises').where({ id: fixtures.paisId }).delete()
}
