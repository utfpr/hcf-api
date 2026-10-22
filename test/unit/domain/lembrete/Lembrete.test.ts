import {
  describe, expect, test
} from 'vitest'

import {
  Attributes, isDataValida, Lembrete
} from '@/domain/lembrete/Lembrete'

const lembrete: Attributes = {
  id: 1,
  data_coleta: '2026-11-20',
  local_coleta: 'Serra do Cipó, trilha da cachoeira',
  familia: 'Velloziaceae',
  nome_popular: 'canela-de-ema',
  nome_cientifico: 'Vellozia squamata',
  municipio: 'Santana do Riacho',
  estado: 'MG',
  referencia_local: '300 m após a ponte',
  tipo_vegetacao: 'Campo rupestre',
  solo: 'Arenoso',
  relevo: 'Ondulado',
  substrato: 'Afloramento rochoso',
  tronco_com_casca: null,
  associacoes: null,
  folhas: 'Lineares',
  habito: 'Herbácea',
  frutos: null,
  flores: 'Esperadas em novembro',
  luminosidade: 'Pleno sol',
  created_at: new Date('2026-10-05T00:00:00.000Z'),
  updated_at: new Date('2026-10-05T00:00:00.000Z'),
  created_by: 7,
  updated_by: 7
}

describe('Lembrete.create', () => {
  test('aceita uma linha nova, ainda sem id e datas de auditoria', () => {
    const {
      id, created_at, updated_at, updated_by, ...novaLinha
    } = lembrete

    const result = Lembrete.create(novaLinha)

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ created_by: lembrete.created_by })
    expect((result.value as Lembrete).id).toBeUndefined()
  })

  test('cria um lembrete com data e local de coleta', () => {
    const result = Lembrete.create(lembrete)

    expect(result.right()).toBe(true)
    const criado = result.value as Lembrete
    expect(criado.data_coleta).toBe('2026-11-20')
    expect(criado.ficha.familia).toBe('Velloziaceae')
  })

  test('rejeita data de coleta fora do formato YYYY-MM-DD', () => {
    const result = Lembrete.create({ ...lembrete, data_coleta: '20/11/2026' })

    expect(result.left()).toBe(true)
  })

  test('rejeita data de coleta inexistente', () => {
    const result = Lembrete.create({ ...lembrete, data_coleta: '2026-02-30' })

    expect(result.left()).toBe(true)
  })

  test('rejeita local de coleta vazio', () => {
    const result = Lembrete.create({ ...lembrete, local_coleta: '   ' })

    expect(result.left()).toBe(true)
  })

  test('guarda descrição e coordenadas, que são opcionais', () => {
    const comCampos = Lembrete.create({
      ...lembrete, descricao: 'Voltar na floração', latitude: -19.27, longitude: -43.58
    })
    const semCampos = Lembrete.create(lembrete)

    expect(comCampos.value).toMatchObject({ descricao: 'Voltar na floração', latitude: -19.27, longitude: -43.58 })
    expect(semCampos.value).toMatchObject({ descricao: null, latitude: null, longitude: null })
  })

  test.each([
    ['latitude', 91],
    ['latitude', -91],
    ['longitude', 181],
    ['longitude', -181]
  ])('rejeita %s fora do intervalo (%s)', (campo, valor) => {
    const result = Lembrete.create({ ...lembrete, [campo]: valor })

    expect(result.left()).toBe(true)
  })
})

describe('isDataValida', () => {
  test.each([
    ['2026-11-20', true],
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['2026-11-20T00:00:00Z', false],
    ['', false]
  ])('%s -> %s', (value, esperado) => {
    expect(isDataValida(value)).toBe(esperado)
  })
})
