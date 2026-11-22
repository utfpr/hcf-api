import {
  describe, expect, test
} from 'vitest'

import { LocalColetaDescricaoInvalidaError } from '@/domain/localColeta/error/LocalColetaDescricaoInvalidaError'
import { LocalColeta } from '@/domain/localColeta/LocalColeta'

describe('LocalColeta', () => {
  test('normaliza a descrição na criação, sem atribuir identidade', () => {
    const result = LocalColeta.create({ descricao: '  Trilha   da mata ', cidade_id: 1 })
    expect(result.right()).toBe(true)
    expect(result.value).toBeInstanceOf(LocalColeta)
    if (result.left()) throw result.value
    expect(result.value.descricao).toBe('Trilha da mata')
    expect(result.value.id).toBeUndefined()
  })

  test('rejeita descrição vazia nas escritas', () => {
    const result = LocalColeta.create({ descricao: ' \n ', cidade_id: 1 })
    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(LocalColetaDescricaoInvalidaError)
  })

  test.each([
    null,
    '',
    '  Nome   legado  '
  ])('preserva descrição legada %s', descricao => {
    const result = LocalColeta.create({
      id: '1', descricao, cidade_id: null, fase_sucessional_id: null, cidade: null, fase_sucessional: null
    })
    if (result.left()) throw result.value
    expect(result.value).toBeInstanceOf(LocalColeta)
    expect(JSON.parse(JSON.stringify(result.value))).toEqual({
      id: '1', descricao, cidade_id: null, fase_sucessional_id: null, cidade: null, fase_sucessional: null
    })
  })
})
