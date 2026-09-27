import {
  afterAll, describe, expect, test
} from 'vitest'

import { gerarSenha } from '@/helpers/senhas'

import { createTestApp } from '../setup/app-factory'

type Usuario = {
  id: number
  nome: string
  email: string
  tipo_usuario_id: number
}

type SessaoBody = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: Usuario
  rules: unknown[]
}

const usuarioColumns = [
  'id',
  'nome',
  'email',
  'tipo_usuario_id'
] as const

function cookieHeader(setCookie: string | string[] | undefined): string | undefined {
  if (!setCookie) {
    return undefined
  }
  return Array.isArray(setCookie) ? setCookie[0] : setCookie
}

function refreshFromSetCookie(setCookie: string | string[] | undefined): string | undefined {
  const header = cookieHeader(setCookie)
  const match = header ? /refresh_token=([^;]+)/.exec(header) : null
  return match ? decodeURIComponent(match[1]) : undefined
}

describe('usuario sessao HTTP', () => {
  const { agent, knex } = createTestApp()
  const createdUserIds: number[] = []

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const herbarios = await knex('usuarios')
        .whereIn('id', createdUserIds)
        .pluck('herbario_id')
      await knex('usuarios_sessoes').whereIn('usuario_id', createdUserIds).delete()
      await knex('usuarios').whereIn('id', createdUserIds).delete()
      if (herbarios.length > 0) {
        await knex('herbarios').whereIn('id', herbarios).delete()
      }
    }
    await knex.destroy()
  })

  async function insertUsuario(email: string, senha: string) {
    let tipo = await knex('tipos_usuarios').orderBy('id', 'asc').first<{ id: number }>()
    if (!tipo) {
      const inserted = await knex('tipos_usuarios')
        .insert({ tipo: 'Curador' })
        .returning<{ id: number }[]>('id')
      tipo = inserted[0]
    }
    if (!tipo) {
      throw new Error('tipos_usuarios row is required')
    }

    const suffix = email.replace(/[^a-z0-9]/gi, '').slice(0, 20)
    const [herbario] = await knex('herbarios')
      .insert({
        nome: `Herbario ${suffix}`,
        sigla: `H${suffix}`.slice(0, 80)
      })
      .returning<{ id: number }[]>('id')

    const usuarios = await knex('usuarios')
      .insert({
        nome: 'Usuario Sessao',
        email,
        senha: gerarSenha(senha),
        tipo_usuario_id: tipo.id,
        herbario_id: herbario.id
      })
      .returning<Usuario[]>(usuarioColumns)

    const usuario = usuarios[0]
    const mapped = {
      ...usuario,
      id: Number(usuario.id),
      tipo_usuario_id: Number(usuario.tipo_usuario_id)
    }
    createdUserIds.push(mapped.id)
    return mapped
  }

  test('login, refresh rotation, me, logout, and failed login', async () => {
    const senha = 'senha-certa'
    const usuario = await insertUsuario('sessao-ok@example.test', senha)

    const login = await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.10')
      .send({ email: usuario.email, senha })
      .expect(200)
    const loginBody = login.body as SessaoBody

    expect(loginBody).toMatchObject({
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario_id: usuario.tipo_usuario_id
      },
      rules: []
    })
    expect(loginBody.access_token).toEqual(expect.any(String))
    expect(loginBody.refresh_token).toEqual(expect.any(String))

    const firstRefresh = refreshFromSetCookie(login.headers['set-cookie'])
    expect(firstRefresh).toBe(loginBody.refresh_token)
    expect(cookieHeader(login.headers['set-cookie'])).toContain('HttpOnly')
    expect(cookieHeader(login.headers['set-cookie'])).toContain('SameSite=None')
    expect(cookieHeader(login.headers['set-cookie'])).toContain('Path=/api/auth')

    const me = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginBody.access_token}`)
      .expect(200)
    expect(me.body).toEqual({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario_id: usuario.tipo_usuario_id
      },
      rules: []
    })

    const refresh = await agent
      .post('/api/auth/refresh')
      .send({ refresh_token: loginBody.refresh_token })
      .expect(200)
    const refreshBody = refresh.body as SessaoBody
    expect(refreshBody.refresh_token).not.toBe(loginBody.refresh_token)
    expect(refreshBody.access_token).toEqual(expect.any(String))

    await agent
      .post('/api/auth/refresh')
      .send({ refresh_token: loginBody.refresh_token })
      .expect(401)

    const cookieRefresh = await agent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshBody.refresh_token}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .expect(200)
    const cookieRefreshBody = cookieRefresh.body as SessaoBody
    expect(cookieRefreshBody.refresh_token).toEqual(expect.any(String))

    await agent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${cookieRefreshBody.refresh_token}`)
      .set('Origin', 'http://evil.example')
      .expect(401)

    await agent
      .get('/api/auth/me')
      .expect(401)

    const logout = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${cookieRefreshBody.access_token}`)
      .expect(204)
    expect(cookieHeader(logout.headers['set-cookie'])).toContain('Max-Age=0')

    await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${cookieRefreshBody.access_token}`)
      .expect(401)

    await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.11')
      .send({ email: usuario.email, senha: 'errada' })
      .expect(401)
  })

  test('logout all deletes every session for the user', async () => {
    const senha = 'senha-certa'
    const usuario = await insertUsuario('sessao-all@example.test', senha)

    const first = await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.20')
      .send({ email: usuario.email, senha })
      .expect(200)
    const firstBody = first.body as SessaoBody
    const second = await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.21')
      .send({ email: usuario.email, senha })
      .expect(200)
    const secondBody = second.body as SessaoBody

    await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${firstBody.access_token}`)
      .send({ all: true })
      .expect(204)

    await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstBody.access_token}`)
      .expect(401)
    await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${secondBody.access_token}`)
      .expect(401)
  })

  test('sixth failed login from the same IP is 429', async () => {
    const senha = 'senha-certa'
    const usuario = await insertUsuario('sessao-limit@example.test', senha)
    const ip = '198.51.100.90'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await agent
        .post('/api/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: usuario.email, senha: 'errada' })
        .expect(401)
    }

    await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: usuario.email, senha: 'errada' })
      .expect(429)
  })
})
