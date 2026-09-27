import {
  describe,
  expect,
  test
} from 'vitest'

import { createRules } from '@/library/auth/createRules'

describe('createRules', () => {
  test('returns no rules for curador, operador, identificador, and unknown tipo', () => {
    const users = [
      { id: 1, tipo_usuario_id: 1 },
      { id: 2, tipo_usuario_id: 2 },
      { id: 3, tipo_usuario_id: 3 },
      { id: 99, tipo_usuario_id: 99 }
    ]

    for (const user of users) {
      expect(createRules(user)).toEqual([])
    }
  })
})
