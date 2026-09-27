import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'

const row = {
  id: '4',
  nome: 'Ana',
  email: 'ana@example.test',
  senha: 'hash',
  tipo_usuario_id: '2'
}

function stubKnex<TResult>(promise: Promise<TResult>): Knex & { builder: Record<string, unknown> } {
  const builder = {} as Record<string, unknown>
  builder.select = vi.fn().mockImplementation(() => builder)
  builder.where = vi.fn().mockImplementation(() => builder)
  builder.first = vi.fn().mockImplementation(() => builder)
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

describe('UsuarioCollectionKnexAdapter', () => {
  test('findByEmail maps snake_case and includes senha', async () => {
    const knex = stubKnex(Promise.resolve(row))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findByEmail('ana@example.test')

    expect(result.right()).toBe(true)
    expect(result.value).toEqual({
      id: 4,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2,
      senha: 'hash'
    })
    expect(knex).toHaveBeenCalledWith('usuarios')
    expect(knex.builder.where).toHaveBeenCalledWith({ email: 'ana@example.test' })
  })

  test('findById omits senha', async () => {
    const knex = stubKnex(Promise.resolve({
      id: 4,
      nome: 'Ana',
      email: 'ana@example.test',
      tipo_usuario_id: 2
    }))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findById(4)

    expect(result.right()).toBe(true)
    expect(result.value).toEqual({
      id: 4,
      nome: 'Ana',
      email: 'ana@example.test',
      tipoUsuarioId: 2
    })
    expect(knex.builder.where).toHaveBeenCalledWith({ id: 4 })
  })

  test('findByEmail returns null when missing', async () => {
    const knex = stubKnex(Promise.resolve(undefined))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findByEmail('missing@example.test')

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
  })
})
