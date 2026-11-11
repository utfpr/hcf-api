import jwt from 'jsonwebtoken'
import { type Knex } from 'knex'

import { gerarSenha } from '@/helpers/senhas'

type Header = { Authorization: string }

type UsuarioAuth = {
  header: Header
  usuarioId: number
  cleanup: () => Promise<void>
}

export function createCuradorAuth(knex: Knex): Promise<UsuarioAuth> {
  return createUsuarioAuth(knex, 1, 'Curador')
}

export function createExpedicionarioAuth(knex: Knex): Promise<UsuarioAuth> {
  return createUsuarioAuth(knex, 4, 'Expedicionário')
}

export async function createUsuarioAuth(knex: Knex, tipoId: number, tipo: string): Promise<UsuarioAuth> {
  await knex('tipos_usuarios')
    .insert({ id: tipoId, tipo })
    .onConflict('id')
    .ignore()
  await knex.raw(`
    SELECT setval(
      pg_get_serial_sequence('tipos_usuarios', 'id'),
      (SELECT COALESCE(MAX(id), 1) FROM tipos_usuarios)
    )
  `)

  const suffix = `veg${Date.now()}${Math.floor(Math.random() * 1e6)}`
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
