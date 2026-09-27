import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'

const COLUMNS = [
  'id',
  'nome',
  'email',
  'tipo_usuario_id',
  'senha'
]

const row = {
  id: 3,
  nome: 'Ana',
  email: 'ana@utfpr.edu.br',
  tipo_usuario_id: 1,
  senha: 'hash'
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
  test('findByEmail maps snake_case columns', async () => {
    const knex = stubKnex(Promise.resolve(row))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findByEmail('ana@utfpr.edu.br')

    expect(result.right()).toBe(true)
    expect(result.value).toEqual({
      id: 3,
      nome: 'Ana',
      email: 'ana@utfpr.edu.br',
      tipoUsuarioId: 1,
      senhaHash: 'hash'
    })
    expect(knex).toHaveBeenCalledWith('usuarios')
    expect(knex.builder.select).toHaveBeenCalledWith(COLUMNS)
    expect(knex.builder.where).toHaveBeenCalledWith({ email: 'ana@utfpr.edu.br' })
  })

  test('findById returns null when missing', async () => {
    const knex = stubKnex(Promise.resolve(undefined))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findById(99)

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
    expect(knex.builder.where).toHaveBeenCalledWith({ id: 99 })
  })

  test('findByEmail returns Either.left on failure', async () => {
    const knex = stubKnex(Promise.reject(new Error('DB down')))
    const adapter = new UsuarioCollectionKnexAdapter({ knex })

    const result = await adapter.findByEmail('ana@utfpr.edu.br')

    expect(result.left()).toBe(true)
  })
})
