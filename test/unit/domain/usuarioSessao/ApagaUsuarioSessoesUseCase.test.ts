import {
  describe, expect, test
} from 'vitest'

import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

describe('ApagaUsuarioSessoesUseCase', () => {
  test('deletes every session for the usuario', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({
      id: '11111111-1111-4111-8111-111111111111',
      usuarioId: 3
    }))
    await collection.create(makeSession({
      id: '22222222-2222-4222-8222-222222222222',
      usuarioId: 3,
      refreshTokenHash: 'e'.repeat(64)
    }))
    await collection.create(makeSession({
      id: '33333333-3333-4333-8333-333333333333',
      usuarioId: 9,
      refreshTokenHash: 'f'.repeat(64)
    }))

    const useCase = new ApagaUsuarioSessoesUseCase({ usuarioSessaoCollection: collection })
    const result = await useCase.execute({ usuarioId: 3 })

    expect(result.right()).toBe(true)
    expect(collection.rows.size).toBe(1)
    expect(collection.rows.has('33333333-3333-4333-8333-333333333333')).toBe(true)
  })
})
