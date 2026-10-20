import jwt from 'jsonwebtoken'
import { type Knex } from 'knex'

import { gerarSenha } from '@/helpers/senhas'

type Header = { Authorization: string }

export async function createCuradorAuth(knex: Knex): Promise<{
  header: Header
  usuarioId: number
  cleanup: () => Promise<void>
}> {
  const tipoId = 1
  const tipo = await knex('tipos_usuarios').where({ id: tipoId }).first<{ id: number }>()
  if (!tipo) {
    await knex('tipos_usuarios').insert({ id: tipoId, tipo: 'Curador' })
  }

  const suffix = `veg${Date.now()}`
  const [herbario] = await knex('herbarios')
    .insert({
      nome: `Herbario ${suffix}`,
      sigla: `H${suffix}`.slice(0, 80)
    })
    .returning<{ id: number }[]>('id')

  const [usuario] = await knex('usuarios')
    .insert({
      nome: 'Vegetacao Curador',
      email: `${suffix}@example.test`,
      senha: String(gerarSenha('senha-teste')),
      tipo_usuario_id: tipoId,
      herbario_id: herbario.id
    })
    .returning<{ id: number }[]>('id')

  const token = jwt.sign(
    { id: Number(usuario.id), tipo_usuario_id: tipoId },
    process.env.JWT_SECRET as string
  )

  return {
    header: { Authorization: `Bearer ${token}` },
    usuarioId: Number(usuario.id),
    cleanup: async () => {
      await knex('usuarios_sessoes').where({ usuario_id: usuario.id }).delete()
      await knex('usuarios').where({ id: usuario.id }).delete()
      await knex('herbarios').where({ id: herbario.id }).delete()
    }
  }
}
