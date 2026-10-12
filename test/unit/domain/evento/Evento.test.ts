import {
  describe, expect, test
} from 'vitest'

import {
  Attributes, ColetaAttributes, Evento
} from '@/domain/evento/Evento'

const ficha: ColetaAttributes = {
  familia: 'Velloziaceae',
  nome_popular: 'canela-de-ema',
  nome_cientifico: 'Vellozia squamata',
  municipio: 'Serra do Cipó',
  estado: 'MG',
  referencia_local: 'Trilha da cachoeira, 300 m após a ponte',
  tipo_vegetacao: 'Campo rupestre',
  solo: 'Arenoso',
  relevo: 'Ondulado',
  substrato: 'Afloramento rochoso',
  tronco_com_casca: 'Sim, gretada',
  associacoes: 'Lychnophora ericoides',
  folhas: 'Lineares, rígidas',
  habito: 'Herbácea',
  frutos: 'Ausentes',
  flores: 'Presentes, lilases',
  luminosidade: 'Pleno sol'
}

const diario: Attributes = {
  id: 1,
  expedicao_id: 10,
  tipo: 'DIARIO',
  capturado_em: new Date('2026-02-15T13:15:00.000Z'),
  latitude: -20.2510,
  longitude: -46.4170,
  altitude: 1200,
  observacoes: 'Área de transição entre cerrado e campo rupestre.',
  coleta: null,
  created_at: new Date('2026-02-16T00:00:00.000Z'),
  updated_at: new Date('2026-02-16T00:00:00.000Z'),
  created_by: 7,
  updated_by: 7
}

const coleta: Attributes = {
  ...diario, tipo: 'COLETA', observacoes: null, coleta: ficha
}

describe('Evento.create', () => {
  test('cria um evento de diário sem ficha', () => {
    const result = Evento.create(diario)

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ tipo: 'DIARIO', coleta: null })
  })

  test('cria um evento de coleta com a ficha', () => {
    const result = Evento.create(coleta)

    expect(result.right()).toBe(true)
    expect(result.value).toMatchObject({ tipo: 'COLETA', coleta: { habito: 'Herbácea' } })
  })

  test('rejeita coleta sem ficha', () => {
    const result = Evento.create({ ...coleta, coleta: null })

    expect(result.left()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })

  test('rejeita diário com ficha', () => {
    const result = Evento.create({ ...diario, coleta: ficha })

    expect(result.left()).toBe(true)
  })

  test('rejeita um tipo desconhecido', () => {
    expect(Evento.create({ ...diario, tipo: 'FOTO' as 'DIARIO' }).left()).toBe(true)
  })

  test('aceita evento sem coordenadas, porque o GPS pode não fixar', () => {
    const result = Evento.create({
      ...diario, latitude: null, longitude: null, altitude: null
    })

    expect(result.right()).toBe(true)
  })

  test('rejeita coordenadas fora de faixa', () => {
    expect(Evento.create({ ...diario, latitude: -91 }).left()).toBe(true)
    expect(Evento.create({ ...diario, longitude: 181 }).left()).toBe(true)
  })

  test('rejeita instante de captura inválido', () => {
    expect(Evento.create({ ...diario, capturado_em: new Date('não é data') }).left()).toBe(true)
  })

  test('rejeita evento sem expedição', () => {
    expect(Evento.create({ ...diario, expedicao_id: 0 }).left()).toBe(true)
  })
})
