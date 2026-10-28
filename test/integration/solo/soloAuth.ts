import jwt from 'jsonwebtoken'
import { type Knex } from 'knex'
import { randomUUID } from 'node:crypto'

import { JwtAccessToken } from '@/infrastructure/auth/JwtAccessToken'

import { createCuradorAuth } from '../setup/curador-auth'

export async function createSoloAuth(knex: Knex) {
  const legacy = await createCuradorAuth(knex)
  try {
    const payload = jwt.decode(legacy.header.Authorization.slice('Bearer '.length)) as { id: number }
    const usuarioId = payload.id
    const sid = randomUUID()
    const now = new Date()
    await knex('usuarios_sessoes').insert({
      id: sid,
      usuario_id: usuarioId,
      refresh_token_hash: randomUUID(),
      created_at: now,
      last_used_at: now,
      expires_at: new Date(now.getTime() + 60 * 60 * 1000)
    })
    const token = new JwtAccessToken({ secret: process.env.JWT_SECRET as string }).sign({ sub: usuarioId, sid })
    if (token.left()) throw token.value

    return {
      header: { Authorization: `Bearer ${token.value}` },
      legacyHeader: legacy.header,
      usuarioId,
      cleanup: legacy.cleanup
    }
  } catch (error) {
    await legacy.cleanup()
    throw error
  }
}
