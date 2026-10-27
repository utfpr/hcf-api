import {
  describe,
  expect,
  test
} from 'vitest'

import { createRules } from '@/library/auth/createRules'

const publicReads = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' },
  { action: 'read', resource: 'Vegetacao' },
  { action: 'read', resource: 'FaseSucessional' },
  { action: 'read', resource: 'Relevo' }
]

const writerRules = [
  { action: 'create', resource: 'FaseSucessional' },
  { action: 'update', resource: 'FaseSucessional' },
  { action: 'delete', resource: 'FaseSucessional' },
  { action: 'create', resource: 'Vegetacao' },
  { action: 'update', resource: 'Vegetacao' },
  { action: 'delete', resource: 'Vegetacao' },
  { action: 'create', resource: 'Relevo' },
  { action: 'update', resource: 'Relevo' },
  { action: 'delete', resource: 'Relevo' }
]

const expedicaoReads = [
  { action: 'read', resource: 'Expedicao' },
  { action: 'read', resource: 'Evento' },
  { action: 'read', resource: 'Evidencia' },
  { action: 'read', resource: 'Lembrete' }
]

const expedicaoWrites = [
  { action: 'create', resource: 'Expedicao' },
  { action: 'update', resource: 'Expedicao' },
  { action: 'delete', resource: 'Expedicao' },
  { action: 'create', resource: 'Evento' },
  { action: 'update', resource: 'Evento' },
  { action: 'delete', resource: 'Evento' },
  { action: 'create', resource: 'Evidencia' },
  { action: 'delete', resource: 'Evidencia' },
  { action: 'create', resource: 'Lembrete' },
  { action: 'update', resource: 'Lembrete' },
  { action: 'delete', resource: 'Lembrete' }
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
        ...expedicaoReads,
        ...writerRules,
        ...expedicaoWrites
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
        { action: 'read', resource: 'UsuarioSessao' },
        ...expedicaoReads
      ])
    }
  })
})
