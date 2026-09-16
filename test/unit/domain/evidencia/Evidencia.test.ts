import {
  describe, expect, test
} from 'vitest'

import { Attributes, Evidencia } from '@/domain/evidencia/Evidencia'

const base: Attributes = {
  id: 1,
  evento_id: 10,
  nome: 'IMG_0042.jpg',
  capturado_em: new Date('2026-02-15T14:32:00.000Z'),
  created_at: new Date('2026-02-16T00:00:00.000Z'),
  updated_at: new Date('2026-02-16T00:00:00.000Z'),
  created_by: null,
  updated_by: null
}

describe('Evidencia.create', () => {
  test('cria a evidência quando nome e instante de captura são válidos', () => {
    const result = Evidencia.create(base)

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ nome: 'IMG_0042.jpg' })
  })

  test('rejeita nome vazio ou só com espaços', () => {
    expect(Evidencia.create({ ...base, nome: '' }).left()).toBe(true)
    expect(Evidencia.create({ ...base, nome: '   ' }).left()).toBe(true)
  })

  test('rejeita evidência sem evento', () => {
    expect(Evidencia.create({ ...base, evento_id: 0 }).left()).toBe(true)
  })

  test('rejeita instante de captura inválido', () => {
    expect(Evidencia.create({ ...base, capturado_em: new Date('não é data') }).left()).toBe(true)
  })
})
