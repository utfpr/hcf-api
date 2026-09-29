import {
  describe, expect, test
} from 'vitest'

import { parseCookieHeader } from '@/library/http/parseCookieHeader'

describe('parseCookieHeader', () => {
  test('returns an empty object when the header is missing', () => {
    expect(parseCookieHeader(undefined)).toEqual({})
  })

  test('parses name-value pairs and decodes the value', () => {
    expect(parseCookieHeader('refresh_token=a%2Fb; other=1')).toEqual({
      refresh_token: 'a/b',
      other: '1'
    })
  })
})
