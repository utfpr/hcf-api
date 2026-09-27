import {
  describe, expect, test
} from 'vitest'

import { BuscaUsuarioSessaoPorHashUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorHashUseCase'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

const NOW = new Date('2026-09-27T12:00:00.000Z')
const HASH = 'a'.repeat(64)

describe('BuscaUsuarioSessaoPorHashUseCase', () => {
  test('returns the session when it is still valid', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const session = makeSession({
      refreshTokenHash: HASH,
      expiresAt: new Date('2026-10-01T00:00:00.000Z')
    })
    await collection.create(session)

    const useCase = new BuscaUsuarioSessaoPorHashUseCase({
      usuarioSessaoCollection: collection,
      now: () => NOW
    })
    const result = await useCase.execute({ refreshTokenHash: HASH })

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ id: session.id })
  })

  test('returns null when the hash is missing', async () => {
    const useCase = new BuscaUsuarioSessaoPorHashUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      now: () => NOW
    })

    const result = await useCase.execute({ refreshTokenHash: '0'.repeat(64) })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
  })

  test('deletes an expired session and returns null', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const session = makeSession({
      refreshTokenHash: HASH,
      expiresAt: new Date('2026-09-27T11:59:59.000Z')
    })
    await collection.create(session)

    const useCase = new BuscaUsuarioSessaoPorHashUseCase({
      usuarioSessaoCollection: collection,
      now: () => NOW
    })
    const result = await useCase.execute({ refreshTokenHash: HASH })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
    expect(collection.rows.has(session.id)).toBe(false)
  })
})
