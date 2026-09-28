import {
  describe, expect, test
} from 'vitest'

import { ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from './FakeUsuarioSessaoCollection'

describe('ApagaUsuarioSessaoUseCase', () => {
  test('deletes the session by id', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const session = makeSession()
    await collection.create(session)

    const useCase = new ApagaUsuarioSessaoUseCase({ usuarioSessaoCollection: collection })
    const result = await useCase.execute({ id: session.id })

    expect(result.right()).toBe(true)
    expect(collection.rows.has(session.id)).toBe(false)
  })

  test('succeeds when the id is already missing', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    const useCase = new ApagaUsuarioSessaoUseCase({ usuarioSessaoCollection: collection })

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    expect(result.right()).toBe(true)
  })
})
