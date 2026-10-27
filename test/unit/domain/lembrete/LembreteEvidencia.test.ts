import {
  describe, expect, test
} from 'vitest'

import { Attributes, LembreteEvidencia } from '@/domain/lembrete/LembreteEvidencia'

const evidencia: Attributes = {
  id: 1,
  lembrete_id: 3,
  nome: 'IMG_0042.jpg',
  arquivo: 'lembrete_3_1700000000000-ab12.jpg',
  mime_type: 'image/jpeg',
  tamanho: 1024,
  data_captura: new Date('2026-10-05T14:32:00.000Z'),
  created_at: new Date('2026-10-05T00:00:00.000Z'),
  updated_at: new Date('2026-10-05T00:00:00.000Z'),
  created_by: 7,
  updated_by: 7
}

describe('LembreteEvidencia.create', () => {
  test.each([
    'image/jpeg',
    'image/png',
    'image/webp'
  ])('aceita foto %s', mimeType => {
    const result = LembreteEvidencia.create({ ...evidencia, mime_type: mimeType })

    expect(result.right()).toBe(true)
  })

  test.each([
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'image/gif',
    'image/bmp',
    'image/svg+xml'
  ])(
    'rejeita %s, pois o lembrete só aceita fotos',
    mimeType => {
      const result = LembreteEvidencia.create({ ...evidencia, mime_type: mimeType })

      expect(result.left()).toBe(true)
      expect((result.value as Error).message).toBe(
        'Multimídia do lembrete aceita apenas fotos (jpeg, png ou webp)'
      )
    }
  )

  test('rejeita tipo do arquivo vazio', () => {
    const result = LembreteEvidencia.create({ ...evidencia, mime_type: ' ' })

    expect(result.left()).toBe(true)
  })
})
