import {
  describe, expect, test
} from 'vitest'

import { EncerraSessaoUseCase } from '@/domain/auth/EncerraSessaoUseCase'
import { ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'
import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'

import {
  FakeUsuarioSessaoCollection,
  makeSession
} from '../usuarioSessao/FakeUsuarioSessaoCollection'

describe('EncerraSessaoUseCase', () => {
  test('deletes one session by id', async () => {
    const collection = new FakeUsuarioSessaoCollection()
    await collection.create(makeSession({ id: '11111111-1111-4111-8111-111111111111' }))
    await collection.create(makeSession({
      id: '22222222-2222-4222-8222-222222222222',
      refreshTokenHash: 'e'.repeat(64)
    }))

    const useCase = new EncerraSessaoUseCase({
      apagaUsuarioSessaoUseCase: new ApagaUsuarioSessaoUseCase({
        usuarioSessaoCollection: collection
      }),
      apagaUsuarioSessoesUseCase: new ApagaUsuarioSessoesUseCase({
        usuarioSessaoCollection: collection
      })
    })

    const result = await useCase.execute({
      all: false,
      sessaoId: '11111111-1111-4111-8111-111111111111'
    })

    expect(result.right()).toBe(true)
    expect(collection.rows.size).toBe(1)
    expect(collection.rows.has('22222222-2222-4222-8222-222222222222')).toBe(true)
  })

  test('deletes every session for the user', async () => {
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

    const useCase = new EncerraSessaoUseCase({
      apagaUsuarioSessaoUseCase: new ApagaUsuarioSessaoUseCase({
        usuarioSessaoCollection: collection
      }),
      apagaUsuarioSessoesUseCase: new ApagaUsuarioSessoesUseCase({
        usuarioSessaoCollection: collection
      })
    })

    const result = await useCase.execute({
      all: true,
      usuarioId: 3
    })

    expect(result.right()).toBe(true)
    expect(collection.rows.size).toBe(0)
  })
})
