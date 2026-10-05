import {
  describe, expect, test
} from 'vitest'

import { Attributes, Expedicao } from '@/domain/expedicao/Expedicao'

const base: Attributes = {
  id: 1,
  descricao: 'Coleta no litoral',
  data_inicio: '2026-03-01',
  data_fim: '2026-03-10',
  cidade_id: 4106902,
  created_at: new Date('2026-03-01T00:00:00.000Z'),
  updated_at: new Date('2026-03-01T00:00:00.000Z'),
  created_by: 7,
  updated_by: 7
}

describe('Expedicao.create', () => {
  test('cria a expedição quando o período e o destino são válidos', () => {
    const result = Expedicao.create(base)

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({
      data_inicio: '2026-03-01', data_fim: '2026-03-10', cidade_id: 4106902
    })
  })

  test('aceita expedição de um único dia', () => {
    const result = Expedicao.create({
      ...base, data_inicio: '2026-03-01', data_fim: '2026-03-01'
    })

    expect(result.right()).toBe(true)
  })

  test('rejeita data de fim anterior à de início', () => {
    const result = Expedicao.create({
      ...base, data_inicio: '2026-03-10', data_fim: '2026-03-01'
    })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })

  test('rejeita expedição sem destino', () => {
    const result = Expedicao.create({ ...base, cidade_id: 0 })

    expect(result.left()).toBe(true)
  })

  test('rejeita período incompleto', () => {
    expect(Expedicao.create({ ...base, data_inicio: '' }).left()).toBe(true)
    expect(Expedicao.create({ ...base, data_fim: '' }).left()).toBe(true)
  })
})
