import {
  describe, expect, test
} from 'vitest'

import { assertCookieSafeOrigins, parseCorsOrigins } from '@/application/parseCorsOrigins'

describe('parseCorsOrigins', () => {
  test('splits a comma-separated list', () => {
    expect(parseCorsOrigins('http://localhost:5173, https://painel.example')).toEqual([
      'http://localhost:5173',
      'https://painel.example'
    ])
  })

  test('rejects missing, empty, or wildcard origins', () => {
    expect(() => parseCorsOrigins(undefined)).toThrow(/CORS_ORIGINS/)
    expect(() => parseCorsOrigins('')).toThrow(/CORS_ORIGINS/)
    expect(() => parseCorsOrigins('*')).toThrow(/CORS_ORIGINS/)
    expect(() => parseCorsOrigins('http://localhost:5173, *')).toThrow(/CORS_ORIGINS/)
  })
})

describe('assertCookieSafeOrigins', () => {
  test('rejects *', () => {
    expect(() => assertCookieSafeOrigins(['*'])).toThrow(/origins/)
  })
})
