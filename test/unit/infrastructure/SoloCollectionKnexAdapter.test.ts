import type { Knex } from 'knex'
import {
  describe, expect, test, vi
} from 'vitest'

import { Solo } from '@/domain/solo/Solo'
import { CollectionError } from '@/infrastructure/error/CollectionError'
import { SoloCollectionKnexAdapter } from '@/infrastructure/SoloCollectionKnexAdapter'

function stubKnex(result: unknown): Knex {
  const builder = {
    select: () => builder,
    whereRaw: () => builder,
    where: () => builder,
    insert: () => builder,
    update: () => builder,
    first: () => Promise.resolve(result),
    returning: () => Promise.resolve([result])
  }
  return vi.fn(() => builder) as unknown as Knex
}

describe('SoloCollectionKnexAdapter', () => {
  test.each([
    'findByNome',
    'create',
    'update'
  ] as const)('%s reconstructs an entity with a numeric database identity', async method => {
    const adapter = new SoloCollectionKnexAdapter({ knex: stubKnex({ id: '42', nome: 'Arenoso' }) })
    const result = await (method === 'findByNome'
      ? adapter.findByNome('Arenoso')
      : method === 'create'
        ? adapter.create({ nome: 'Arenoso' })
        : adapter.update(42, { nome: 'Arenoso' }))

    expect(result.right()).toBe(true)
    expect(result.value).toBeInstanceOf(Solo)
    expect(result.value).toEqual({ id: 42, nome: 'Arenoso' })
  })

  test.each([
    'findByNome',
    'create',
    'update'
  ] as const)('%s rejects a stored row that violates the entity invariant', async method => {
    const adapter = new SoloCollectionKnexAdapter({ knex: stubKnex({ id: '42', nome: '   ' }) })
    const result = await (method === 'findByNome'
      ? adapter.findByNome('Arenoso')
      : method === 'create'
        ? adapter.create({ nome: 'Arenoso' })
        : adapter.update(42, { nome: 'Arenoso' }))

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(CollectionError)
  })

  test('findById, findByNome and update preserve missing rows as undefined', async () => {
    const adapter = new SoloCollectionKnexAdapter({ knex: stubKnex(undefined) })
    expect((await adapter.findById(42)).value).toBeUndefined()
    expect((await adapter.findByNome('Ausente')).value).toBeUndefined()
    expect((await adapter.update(42, { nome: 'Ausente' })).value).toBeUndefined()
  })
})
