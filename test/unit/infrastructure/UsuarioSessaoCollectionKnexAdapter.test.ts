import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import type { Attributes } from '@/domain/usuarioSessao/UsuarioSessao'
import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'

const COLUMNS = [
  'id',
  'usuario_id',
  'refresh_token_hash',
  'created_at',
  'last_used_at',
  'expires_at'
]

const attributes: Attributes = {
  id: '11111111-1111-4111-8111-111111111111',
  usuarioId: 4,
  refreshTokenHash: 'a'.repeat(64),
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  lastUsedAt: new Date('2026-09-01T00:00:00.000Z'),
  expiresAt: new Date('2026-10-01T00:00:00.000Z')
}

const row = {
  id: attributes.id,
  usuario_id: attributes.usuarioId,
  refresh_token_hash: attributes.refreshTokenHash,
  created_at: attributes.createdAt,
  last_used_at: attributes.lastUsedAt,
  expires_at: attributes.expiresAt
}

function stubKnex<TResult>(promise: Promise<TResult>): Knex & { builder: Record<string, unknown> } {
  const builder = {} as Record<string, unknown>
  builder.insert = vi.fn().mockImplementation(() => builder)
  builder.returning = vi.fn().mockImplementation(() => builder)
  builder.select = vi.fn().mockImplementation(() => builder)
  builder.where = vi.fn().mockImplementation(() => builder)
  builder.first = vi.fn().mockImplementation(() => builder)
  builder.update = vi.fn().mockImplementation(() => builder)
  builder.delete = vi.fn().mockImplementation(() => builder)
  builder.then = (
    onResolved: (v: TResult) => unknown,
    onRejected?: (e: unknown) => unknown
  ): Promise<unknown> => promise.then(onResolved, onRejected)

  const knex = vi.fn(() => builder) as unknown as Knex & {
    builder: Record<string, unknown>
  }
  knex.builder = builder
  return knex
}

describe('UsuarioSessaoCollectionKnexAdapter', () => {
  test('create inserts snake_case columns and maps the row', async () => {
    const knex = stubKnex(Promise.resolve([row]))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const result = await adapter.create(attributes)

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(attributes)
    expect(knex).toHaveBeenCalledWith('usuarios_sessoes')
    expect(knex.builder.insert).toHaveBeenCalledWith({
      id: attributes.id,
      usuario_id: attributes.usuarioId,
      refresh_token_hash: attributes.refreshTokenHash,
      created_at: attributes.createdAt,
      last_used_at: attributes.lastUsedAt,
      expires_at: attributes.expiresAt
    })
    expect(knex.builder.returning).toHaveBeenCalledWith(COLUMNS)
  })

  test('findById maps a row and returns null when missing', async () => {
    const knex = stubKnex(Promise.resolve(row))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const found = await adapter.findById(attributes.id)

    expect(found.right()).toBe(true)
    expect(found.value).toEqual(attributes)
    expect(knex.builder.where).toHaveBeenCalledWith({ id: attributes.id })
    expect(knex.builder.select).toHaveBeenCalledWith(COLUMNS)

    const missingKnex = stubKnex(Promise.resolve(undefined))
    const missing = await new UsuarioSessaoCollectionKnexAdapter({ knex: missingKnex })
      .findById(attributes.id)
    expect(missing.right()).toBe(true)
    expect(missing.value).toBeNull()
  })

  test('findByRefreshTokenHash looks up by hash', async () => {
    const knex = stubKnex(Promise.resolve(row))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const result = await adapter.findByRefreshTokenHash(attributes.refreshTokenHash)

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(attributes)
    expect(knex.builder.where).toHaveBeenCalledWith({
      refresh_token_hash: attributes.refreshTokenHash
    })
  })

  test('updateRotation updates only rotation columns', async () => {
    const updated = {
      ...row,
      refresh_token_hash: 'b'.repeat(64),
      last_used_at: new Date('2026-09-27T00:00:00.000Z'),
      expires_at: new Date('2026-10-27T00:00:00.000Z')
    }
    const knex = stubKnex(Promise.resolve([updated]))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const result = await adapter.updateRotation(attributes.id, {
      refreshTokenHash: updated.refresh_token_hash,
      lastUsedAt: updated.last_used_at,
      expiresAt: updated.expires_at
    })

    expect(result.right()).toBe(true)
    expect(result.value).toEqual({
      id: attributes.id,
      usuarioId: attributes.usuarioId,
      refreshTokenHash: updated.refresh_token_hash,
      createdAt: attributes.createdAt,
      lastUsedAt: updated.last_used_at,
      expiresAt: updated.expires_at
    })
    expect(knex.builder.where).toHaveBeenCalledWith({ id: attributes.id })
    expect(knex.builder.update).toHaveBeenCalledWith({
      refresh_token_hash: updated.refresh_token_hash,
      last_used_at: updated.last_used_at,
      expires_at: updated.expires_at
    })
  })

  test('updateRotation returns null when no row is updated', async () => {
    const knex = stubKnex(Promise.resolve([]))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const result = await adapter.updateRotation(attributes.id, {
      refreshTokenHash: 'b'.repeat(64),
      lastUsedAt: attributes.lastUsedAt,
      expiresAt: attributes.expiresAt
    })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
  })

  test('deleteById and deleteByUsuarioId succeed', async () => {
    const knex = stubKnex(Promise.resolve(1))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const byId = await adapter.deleteById(attributes.id)
    expect(byId.right()).toBe(true)
    expect(knex.builder.where).toHaveBeenCalledWith({ id: attributes.id })
    expect(knex.builder.delete).toHaveBeenCalled()

    const byUser = await adapter.deleteByUsuarioId(4)
    expect(byUser.right()).toBe(true)
    expect(knex.builder.where).toHaveBeenCalledWith({ usuario_id: 4 })
  })

  test('returns Either.left on failure', async () => {
    const knex = stubKnex(Promise.reject(new Error('DB down')))
    const adapter = new UsuarioSessaoCollectionKnexAdapter({ knex })

    const result = await adapter.create(attributes)

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })
})
