import {
  describe,
  expect,
  test
} from 'vitest'

import { createRules } from '@/library/auth/createRules'

const publicReads = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' },
  { action: 'read', resource: 'FaseSucessional' },
  { action: 'read', resource: 'Vegetacao' }
]

const writerRules = [
  { action: 'create', resource: 'FaseSucessional' },
  { action: 'update', resource: 'FaseSucessional' },
  { action: 'delete', resource: 'FaseSucessional' },
  { action: 'create', resource: 'Vegetacao' },
  { action: 'update', resource: 'Vegetacao' },
  { action: 'delete', resource: 'Vegetacao' }
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
        ...writerRules
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
})
