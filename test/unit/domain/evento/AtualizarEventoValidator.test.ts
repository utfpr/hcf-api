import {
  describe, expect, test
} from 'vitest'

import { AtualizarEventoValidator } from '@/domain/evento/AtualizarEventoValidator'
import { Attributes, ColetaAttributes } from '@/domain/evento/Evento'

function fichaCompleta(overrides: Partial<ColetaAttributes> = {}): ColetaAttributes {
  return {
    associacoes: null,
    estado: null,
    familia: null,
    flores: null,
    folhas: null,
    frutos: null,
    habito: null,
    luminosidade: null,
    municipio: null,
    nome_cientifico: 'Vellozia squamata',
    nome_popular: null,
    referencia_local: null,
    relevo: null,
    solo: null,
    substrato: null,
    tipo_vegetacao: null,
    tronco_com_casca: null,
    ...overrides
  }
}

const diarioAttributes: Attributes = {
  altitude: null,
  capturado_em: new Date('2026-02-15T14:32:00Z'),
  coleta: null,
  created_at: new Date(),
  created_by: null,
  expedicao_id: 1,
  id: 10,
  latitude: -20.2508,
  longitude: -46.4167,
  observacoes: 'Solo arenoso',
  tipo: 'DIARIO',
  updated_at: new Date(),
  updated_by: null
}

const coletaAttributes: Attributes = {
  ...diarioAttributes,
  coleta: fichaCompleta(),
  id: 11,
  observacoes: null,
  tipo: 'COLETA'
}

describe('AtualizarEventoValidator', () => {
  const validator = new AtualizarEventoValidator()

  test('mescla campos comuns sem tocar no tipo nem na ficha', () => {
    const result = validator.validar(diarioAttributes, { latitude: -21, updated_by: 5 })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value).toMatchObject({
      coleta: null, latitude: -21, tipo: 'DIARIO', updated_by: 5
    })
  })

  test('COLETA -> DIARIO descarta a ficha mesmo sem o cliente mandar coleta', () => {
    const result = validator.validar(coletaAttributes, { tipo: 'DIARIO', updated_by: null })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.coleta).toBeNull()
    expect(result.value.tipo).toBe('DIARIO')
  })

  test('DIARIO -> COLETA sem ficha no corpo é rejeitado', () => {
    const result = validator.validar(diarioAttributes, { tipo: 'COLETA', updated_by: null })

    expect(result.left()).toBe(true)
  })

  test('DIARIO -> COLETA com ficha no corpo é aceito', () => {
    const ficha = fichaCompleta({ habito: 'Herbácea' })
    const result = validator.validar(diarioAttributes, {
      coleta: ficha, tipo: 'COLETA', updated_by: null
    })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.coleta).toEqual(ficha)
  })

  test('mantém COLETA e mantém a ficha atual quando coleta não é enviado', () => {
    const result = validator.validar(coletaAttributes, { latitude: -22, updated_by: null })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.coleta).toEqual(coletaAttributes.coleta)
  })

  test('mantém COLETA e substitui a ficha inteira quando coleta é enviado', () => {
    const novaFicha = fichaCompleta({ habito: 'Arbustiva', nome_cientifico: 'Outra espécie' })
    const result = validator.validar(coletaAttributes, { coleta: novaFicha, updated_by: null })

    expect(result.right()).toBe(true)
    if (!result.right()) return
    expect(result.value.coleta).toEqual(novaFicha)
  })

  test('rejeita coordenadas fora de faixa (reaproveita Evento.create)', () => {
    const result = validator.validar(diarioAttributes, { latitude: 200, updated_by: null })

    expect(result.left()).toBe(true)
  })
})
