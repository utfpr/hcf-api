import {
  describe,
  expect,
  test
} from 'vitest'

import { createRules, GUEST_USER } from '@/library/auth/createRules'

const publicReads = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' }
]

describe('createRules', () => {
  test('grants Guest only public reads', () => {
    expect(createRules(GUEST_USER)).toEqual(publicReads)
  })

  test('grants authenticated users public reads and UsuarioSessao', () => {
    const users = [
      { id: 1, tipo_usuario_id: 1 },
      { id: 2, tipo_usuario_id: 2 },
      { id: 3, tipo_usuario_id: 3 },
      { id: 99, tipo_usuario_id: 99 }
    ]

    for (const user of users) {
      expect(createRules(user)).toEqual([
        ...publicReads,
        { action: 'read', resource: 'UsuarioSessao' }
      ])
    }
  })
})
