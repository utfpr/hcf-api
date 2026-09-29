import {
  describe, expect, test, vi
} from 'vitest'

import { AtualizarEventoUseCase } from '@/domain/evento/AtualizarEventoUseCase'
import { Attributes, ColetaAttributes } from '@/domain/evento/Evento'
import { EventoCollection } from '@/domain/evento/EventoCollection'
import { Either } from '@/library/either/Either'

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

const makeMockCollection = (overrides?: Partial<EventoCollection>): EventoCollection => ({
  create: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn().mockResolvedValue(Either.right(diarioAttributes)),
  update: vi.fn().mockResolvedValue(Either.right(diarioAttributes)),
  ...overrides
})

describe('AtualizarEventoUseCase', () => {
  test('atualiza campos comuns sem tocar no tipo', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({
      id: 10, latitude: -21, updated_by: 5
    })

    expect(result.right()).toBe(true)
    expect(collection.update).toHaveBeenCalledWith(10, {
      altitude: null,
      capturado_em: diarioAttributes.capturado_em,
      coleta: null,
      latitude: -21,
      longitude: diarioAttributes.longitude,
      observacoes: diarioAttributes.observacoes,
      tipo: 'DIARIO',
      updated_by: 5
    })
  })

  test('retorna null quando o evento não existe', async () => {
    const collection = makeMockCollection({
      findById: vi.fn().mockResolvedValue(Either.right(null))
    })
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({ id: 999, updated_by: null })

    expect(result.right()).toBe(true)
    expect(result.value).toBeNull()
    expect(collection.update).not.toHaveBeenCalled()
  })

  test('rejeita coordenadas fora de faixa sem chamar update', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({
      id: 10, latitude: 200, updated_by: null
    })

    expect(result.left()).toBe(true)
    expect(collection.update).not.toHaveBeenCalled()
  })

  test('COLETA -> DIARIO descarta a ficha mesmo sem o cliente mandar coleta', async () => {
    const collection = makeMockCollection({
      findById: vi.fn().mockResolvedValue(Either.right(coletaAttributes)),
      update: vi.fn().mockResolvedValue(Either.right({
        ...coletaAttributes, coleta: null, tipo: 'DIARIO'
      }))
    })
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({
      id: 11, observacoes: 'virou diário', tipo: 'DIARIO', updated_by: null
    })

    expect(result.right()).toBe(true)
    expect(collection.update).toHaveBeenCalledWith(11, expect.objectContaining({
      coleta: null,
      tipo: 'DIARIO'
    }))
  })

  test('DIARIO -> COLETA exige a ficha no corpo da requisição', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({
      id: 10, tipo: 'COLETA', updated_by: null
    })

    expect(result.left()).toBe(true)
    expect(collection.update).not.toHaveBeenCalled()
  })

  test('DIARIO -> COLETA com ficha no corpo é aceito', async () => {
    const collection = makeMockCollection()
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const ficha = fichaCompleta({ habito: 'Herbácea' })
    const result = await useCase.execute({
      coleta: ficha, id: 10, tipo: 'COLETA', updated_by: null
    })

    expect(result.right()).toBe(true)
    expect(collection.update).toHaveBeenCalledWith(10, expect.objectContaining({
      coleta: ficha,
      tipo: 'COLETA'
    }))
  })

  test('mantém o tipo COLETA e mantém a ficha atual quando coleta não é enviado', async () => {
    const collection = makeMockCollection({
      findById: vi.fn().mockResolvedValue(Either.right(coletaAttributes)),
      update: vi.fn().mockResolvedValue(Either.right(coletaAttributes))
    })
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const result = await useCase.execute({
      id: 11, latitude: -22, updated_by: null
    })

    expect(result.right()).toBe(true)
    expect(collection.update).toHaveBeenCalledWith(11, expect.objectContaining({
      coleta: coletaAttributes.coleta,
      tipo: 'COLETA'
    }))
  })

  test('mantém o tipo COLETA e substitui a ficha inteira quando coleta é enviado', async () => {
    const collection = makeMockCollection({
      findById: vi.fn().mockResolvedValue(Either.right(coletaAttributes))
    })
    const useCase = new AtualizarEventoUseCase({ eventoCollection: collection })

    const novaFicha = fichaCompleta({ habito: 'Arbustiva', nome_cientifico: 'Outra espécie' })
    await useCase.execute({
      coleta: novaFicha, id: 11, updated_by: null
    })

    expect(collection.update).toHaveBeenCalledWith(11, expect.objectContaining({ coleta: novaFicha }))
  })
})
