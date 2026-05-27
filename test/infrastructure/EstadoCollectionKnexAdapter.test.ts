import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'

function stubKnex<TResult>(promise: Promise<TResult>): Knex & { builder: Record<string, unknown> } {
  const builder = {} as Record<string, unknown>
  builder.orderBy = vi.fn().mockImplementation(() => builder)
  builder.select = vi.fn().mockImplementation(() => builder)
  builder.where = vi.fn().mockImplementation(() => builder)
  builder.then = (
    onResolved: (v: TResult) => unknown,
    onRejected?: (e: unknown) => unknown
  ): Promise<unknown> => promise.then(onResolved, onRejected)

  const knex = vi.fn(() => builder) as unknown as Knex & {
    builder: Record<string, unknown>
  }

  knex.builder = builder
  return knex as Knex & { builder: Record<string, unknown> }
}

describe('EstadoCollectionKnexAdapter', () => {
  test('findAll applies paisSigla filter and returns rows', async () => {
    const rows = [
      {
        id: 1, nome: 'Paraná', sigla: 'PR'
      }
    ]

    const knex = stubKnex(Promise.resolve(rows))
    const adapter = new EstadoCollectionKnexAdapter({ knex })

    const result = await adapter.findAll({ paisSigla: 'BRA' })

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(rows)
    expect(knex).toHaveBeenCalledWith('estados')
    expect(knex.builder.select).toHaveBeenCalledWith([
      'id',
      'nome',
      'sigla'
    ])
    expect(knex.builder.where).toHaveBeenCalledWith('paises_sigla', 'BRA')
    expect(knex.builder.orderBy).toHaveBeenCalledWith('nome')
  })

  test('findAll returns all rows when no filters provided', async () => {
    const rows = [
      {
        id: 1, nome: 'Paraná', sigla: 'PR'
      },
      {
        id: 2, nome: 'São Paulo', sigla: 'SP'
      }
    ]

    const knex = stubKnex(Promise.resolve(rows))
    const adapter = new EstadoCollectionKnexAdapter({ knex })

    const result = await adapter.findAll({})

    expect(result.right()).toBe(true)
    expect(result.value).toHaveLength(2)
    expect(knex.builder.where).not.toHaveBeenCalled()
  })

  test('findAll returns Either.left on failure', async () => {
    const knex = stubKnex(Promise.reject(new Error('DB down')))
    const adapter = new EstadoCollectionKnexAdapter({ knex })

    const result = await adapter.findAll({ paisSigla: 'BRA' })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })
})
