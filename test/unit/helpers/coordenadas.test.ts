import {
  describe,
  expect,
  test
} from 'vitest'

import {
  converteDecimalParaGrausMinutosSegundos,
  converteParaDecimal
} from '@/helpers/coordenadas'

describe('converteParaDecimal', () => {
  test('converts compact DMS latitude 48°56\'15,00"S to decimal degrees', () => {
    expect(converteParaDecimal('48°56\'15,00"S')).toBe(-48.9375)
  })

  test('converts compact DMS longitude 48°56\'16,00"W to decimal degrees', () => {
    expect(converteParaDecimal('48°56\'16,00"W')).toBeCloseTo(
      -(48 + 56 / 60 + 16 / 3600),
      10
    )
  })

  test('accepts a space before the hemisphere', () => {
    expect(converteParaDecimal('48°56\'15,00" S')).toBe(-48.9375)
    expect(converteParaDecimal('48°56\'16,00" W')).toBeCloseTo(
      -(48 + 56 / 60 + 16 / 3600),
      10
    )
  })

  test('applies a positive sign for N and E', () => {
    expect(converteParaDecimal('48°56\'15,00"N')).toBe(48.9375)
    expect(converteParaDecimal('48°56\'16,00"E')).toBeCloseTo(
      48 + 56 / 60 + 16 / 3600,
      10
    )
  })

  test('throws when the coordinate is not DMS', () => {
    expect(() => converteParaDecimal('48.9375')).toThrow('Coordenada inválida')
    expect(() => converteParaDecimal('')).toThrow('Coordenada inválida')
  })
})

describe('converteDecimalParaGrausMinutosSegundos', () => {
  const latitudeHcf46776 = converteParaDecimal('25°18\'27,00"S')
  const longitudeHcf46776 = converteParaDecimal('49°0\'49,00"W')

  test('formats HCF 46776 latitude as south, not west', () => {
    expect(
      converteDecimalParaGrausMinutosSegundos(latitudeHcf46776, true, true)
    ).toBe('25°18\'27,00" S')
  })

  test('formats HCF 46776 longitude as west, not south', () => {
    expect(
      converteDecimalParaGrausMinutosSegundos(longitudeHcf46776, false, true)
    ).toBe('49°0\'49,00" W')
  })

  test('uses N/S for latitude and E/W for longitude', () => {
    expect(converteDecimalParaGrausMinutosSegundos(25.3075, true, true)).toMatch(/ N$/)
    expect(converteDecimalParaGrausMinutosSegundos(-25.3075, true, true)).toMatch(/ S$/)
    expect(converteDecimalParaGrausMinutosSegundos(49.013611, false, true)).toMatch(/ E$/)
    expect(converteDecimalParaGrausMinutosSegundos(-49.013611, false, true)).toMatch(/ W$/)
  })
})
