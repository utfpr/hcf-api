import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import type { Attributes } from '@/domain/pais/Pais'
import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'

function stubKnex<TResult>(promise: Promise<TResult>): Knex & { builder: Record<string, unknown> } {
  const builder = {} as Record<string, unknown>
  builder.orderBy = vi.fn().mockImplementation(() => builder)
  builder.select = vi.fn().mockImplementation(() => builder)
  builder.then = (
    onResolved: (v: TResult) => unknown,
    onRejected?: (e: unknown) => unknown
  ): Promise<unknown> => promise.then(onResolved, onRejected)
  builder.whereILike = vi.fn().mockImplementation(() => builder)

  const knex = vi.fn(() => builder) as unknown as Knex & {
    builder: Record<string, unknown>
  }

  knex.builder = builder
  return knex as Knex & { builder: Record<string, unknown> }
}

describe('PaisCollectionKnexAdapter', () => {
  test('findAll returns rows from knex', async () => {
    const rows: Attributes[] = [
      {
        id: 1, nome: 'Brasil', sigla: 'BRA'
      }
    ]

    const knex = stubKnex(Promise.resolve(rows))
    const adapter = new PaisCollectionKnexAdapter({ knex })

    const result = await adapter.findAll({})

    expect(result.right()).toBe(true)
    expect(result.value).toEqual(rows)
    expect(knex).toHaveBeenCalledWith('paises')
    expect(knex.builder.select).toHaveBeenCalledWith([
      'id',
      'nome',
      'sigla'
    ])
    expect(knex.builder.whereILike).not.toHaveBeenCalled()
  })

  test('findAll passes nome filter to whereILike', async () => {
    const rows: Attributes[] = []
    const knex = stubKnex(Promise.resolve(rows))
    const adapter = new PaisCollectionKnexAdapter({ knex })

    await adapter.findAll({ nome: 'Bra' })

    expect(knex.builder.whereILike).toHaveBeenCalledWith(
      'nome',
      '%Bra%'
    )
  })

  test('findAll returns Either.left on failure', async () => {
    const knex = stubKnex(Promise.reject(new Error('DB down')))
    const adapter = new PaisCollectionKnexAdapter({ knex })

    const result = await adapter.findAll({})

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })
})
