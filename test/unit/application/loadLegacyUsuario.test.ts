import {
  beforeEach, describe, expect, test, vi, type Mock
} from 'vitest'

import { loadLegacyUsuario } from '@/application/loadLegacyUsuario'
import { decodificaTokenUsuario } from '@/helpers/tokens'

import { FakeUsuarioCollection } from '../domain/usuario/FakeUsuarioCollection'

vi.mock('@/helpers/tokens', () => ({
  decodificaTokenUsuario: vi.fn()
}))

type LegacyPayload = {
  id?: unknown
  nome?: string
  email?: string
  tipo_usuario_id?: number
}

const decode = decodificaTokenUsuario as unknown as Mock<(token: string) => LegacyPayload>

describe('loadLegacyUsuario', () => {
  const usuarios = new FakeUsuarioCollection()

  beforeEach(() => {
    usuarios.byId.clear()
    decode.mockReset()
    usuarios.add({
      id: 4,
      nome: 'Curador',
      email: 'curador@test',
      tipoUsuarioId: 1,
      senha: 'hash'
    })
  })

  test('returns the user when the 2-day JWT has a known id', async () => {
    decode.mockReturnValue({
      id: 4,
      nome: 'Curador',
      email: 'curador@test',
      tipo_usuario_id: 1
    })

    await expect(loadLegacyUsuario('two-day', usuarios)).resolves.toEqual({
      id: 4,
      nome: 'Curador',
      email: 'curador@test',
      tipo_usuario_id: 1
    })
  })

  test('returns undefined when the user is missing', async () => {
    decode.mockReturnValue({
      id: 99
    })

    await expect(loadLegacyUsuario('two-day', usuarios)).resolves.toBeUndefined()
  })

  test('rethrows TokenExpiredError', async () => {
    const expired = new Error('jwt expired')
    expired.name = 'TokenExpiredError'
    decode.mockImplementation(() => {
      throw expired
    })

    await expect(loadLegacyUsuario('two-day', usuarios)).rejects.toBe(expired)
  })
})
