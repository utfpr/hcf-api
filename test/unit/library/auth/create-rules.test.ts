import {
  describe,
  expect,
  test
} from 'vitest'

import { createRules } from '@/library/auth/createRules'

const publicReads = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' },
  { action: 'read', resource: 'Vegetacao' }
]

const vegetacaoWrites = [
  { action: 'create', resource: 'Vegetacao' },
  { action: 'update', resource: 'Vegetacao' },
  { action: 'delete', resource: 'Vegetacao' }
]

const faseSucessionalWrites = [
  { action: 'create', resource: 'FaseSucessional' },
  { action: 'update', resource: 'FaseSucessional' },
  { action: 'delete', resource: 'FaseSucessional' }
]

describe('createRules', () => {
  test('grants Guest only public reads', () => {
    expect(createRules()).toEqual(publicReads)
    expect(createRules(undefined)).toEqual(publicReads)
  })

  test('grants curador and operador write permissions', () => {
    for (const user of [
      { id: 1, tipo_usuario_id: 1 },
      { id: 2, tipo_usuario_id: 2 }
    ]) {
      expect(createRules(user)).toEqual([
        ...publicReads,
        { action: 'read', resource: 'UsuarioSessao' },
        ...faseSucessionalWrites,
        ...vegetacaoWrites
      ])
    }
  })

  test('grants other authenticated users public reads and UsuarioSessao', () => {
    for (const user of [
      { id: 3, tipo_usuario_id: 3 },
      { id: 99, tipo_usuario_id: 99 }
    ]) {
      expect(createRules(user)).toEqual([
        ...publicReads,
        { action: 'read', resource: 'UsuarioSessao' }
      ])
    }
  })

  test('grants FaseSucessional writes only to tipo_usuario_id 1 and 2', () => {
    const users = [
      { id: 1, tipo_usuario_id: 1 },
      { id: 2, tipo_usuario_id: 2 }
    ]

    for (const user of users) {
      expect(createRules(user)).toEqual([
        ...publicReads,
        { action: 'read', resource: 'UsuarioSessao' },
        ...faseSucessionalWrites,
        ...vegetacaoWrites
      ])
    }
  })
})
