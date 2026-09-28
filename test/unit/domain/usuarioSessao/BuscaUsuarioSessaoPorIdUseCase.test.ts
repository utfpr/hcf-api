import {
  describe, expect, test
} from 'vitest'

import { BuscaUsuarioSessaoPorIdUseCase } from '@/domain/usuarioSessao/BuscaUsuarioSessaoPorIdUseCase'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

const NOW = new Date('2026-09-27T12:00:00.000Z')

describe('BuscaUsuarioSessaoPorIdUseCase', () => {
  test('returns the session when it is still valid', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const session = makeSession({ expiresAt: new Date('2026-10-01T00:00:00.000Z') })
    await collection.create(session)

    const useCase = new BuscaUsuarioSessaoPorIdUseCase({
      usuarioSessaoCollection: collection,
      now: () => NOW
    })
    const result = await useCase.execute({ id: session.id })

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ id: session.id })
  })

  test('returns null when the session is missing', async () => {
    const useCase = new BuscaUsuarioSessaoPorIdUseCase({
      usuarioSessaoCollection: new FakeUsuarioSessaoCollection(),
      now: () => NOW
    })

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
  })

  test('deletes an expired session and returns null', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const session = makeSession({ expiresAt: new Date('2026-09-27T11:59:59.000Z') })
    await collection.create(session)

    const useCase = new BuscaUsuarioSessaoPorIdUseCase({
      usuarioSessaoCollection: collection,
      now: () => NOW
    })
    const result = await useCase.execute({ id: session.id })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
    expect(collection.rows.has(session.id)).toBe(false)
  })
})
