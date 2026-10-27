import {
  describe,
  expect,
  test
} from 'vitest'

import { Manager, type Rule } from '@/library/auth/Manager'

type Resource = 'Cidade' | 'Pais'
type Action = 'read' | 'update' | 'create'

describe('Manager', () => {
  test('allows a type-level action that has a rule', () => {
    const manager = new Manager<Resource, Action>({
      rules: [{ action: 'read', resource: 'Cidade' }]
    })

    expect(manager.can('read', 'Cidade')).toBe(true)
    expect(manager.can('update', 'Cidade')).toBe(false)
    expect(manager.can('read', 'Pais')).toBe(false)
  })

  test('type-level can is true when the only matching rule has conditions', () => {
    const rules: Rule<Resource, Action>[] = [
      {
        action: 'update',
        resource: 'Cidade',
        conditions: { id: 10 }
      }
    ]
    const manager = new Manager<Resource, Action>({ rules })

    expect(manager.can('update', 'Cidade')).toBe(true)
  })

  test('record-level can matches conditions', () => {
    const manager = new Manager<Resource, Action>({
      rules: [
        {
          action: 'update',
          resource: 'Cidade',
          conditions: { id: 10 }
        }
      ]
    })

    expect(manager.can('update', 'Cidade', { id: 10 })).toBe(true)
    expect(manager.can('update', 'Cidade', { id: 11 })).toBe(false)
  })

  test('canAny and canAll honor empty lists and optional records', () => {
    const manager = new Manager<Resource, Action>({
      rules: [
        { action: 'read', resource: 'Cidade' },
        {
          action: 'update',
          resource: 'Cidade',
          conditions: { id: 10 }
        }
      ]
    })

    expect(manager.canAny([], 'Cidade')).toBe(false)
    expect(manager.canAll([], 'Cidade')).toBe(false)
    expect(manager.canAny(['read', 'create'], 'Cidade')).toBe(true)
    expect(manager.canAll(['read', 'update'], 'Cidade')).toBe(true)
    expect(manager.canAll(['read', 'create'], 'Cidade')).toBe(false)
    expect(manager.canAny(['update'], 'Cidade', { id: 10 })).toBe(true)
    expect(manager.canAny(['update'], 'Cidade', { id: 11 })).toBe(false)
    expect(manager.canAll(['update'], 'Cidade', { id: 10 })).toBe(true)
    expect(manager.canAll(['update'], 'Cidade', { id: 11 })).toBe(false)
  })

  test('exposes the input rules', () => {
    const rules: Rule<Resource, Action>[] = [{ action: 'read', resource: 'Pais' }]
    const manager = new Manager<Resource, Action>({ rules })

    expect(manager.rules).toBe(rules)
  })
})
