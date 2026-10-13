import { type Knex } from 'knex'

import { gerarSenha } from '@/helpers/senhas'

export async function insertUsuarioComTipo(knex: Knex, tipoUsuarioId: number): Promise<{ id: number; cleanup: () => Promise<void> }> {
  await knex('tipos_usuarios')
    .insert({ id: tipoUsuarioId, tipo: `Tipo ${tipoUsuarioId}` })
    .onConflict('id')
    .ignore()

  const suffix = `${tipoUsuarioId}${Date.now()}${Math.floor(Math.random() * 1e6)}`
  const [herbario] = await knex('herbarios')
    .insert({ nome: `Herbario ${suffix}`, sigla: `H${suffix}`.slice(0, 80) })
    .returning<{ id: number }[]>('id')
  const [usuario] = await knex('usuarios')
    .insert({
      nome: 'Usuario Teste',
      email: `fase-${suffix}@example.test`,
      senha: gerarSenha('senha-teste') as string,
      tipo_usuario_id: tipoUsuarioId,
      herbario_id: herbario.id
    })
    .returning<{ id: number }[]>('id')

  const id = Number(usuario.id)

  return {
    id,
    cleanup: async () => {
      await knex('usuarios').where({ id }).delete()
      await knex('herbarios').where({ id: herbario.id }).delete()
    }
  }
}
