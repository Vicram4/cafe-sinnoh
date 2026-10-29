import { describe, expect, it } from 'vitest'
import { formatPriceCents } from './format'

// Intl separa importe y símbolo con un espacio de no separación (U+00A0).
const NBSP = ' '

describe('formatPriceCents', () => {
  it('convierte céntimos a euros con coma decimal', () => {
    expect(formatPriceCents(1250)).toBe(`12,50${NBSP}€`)
  })

  it('muestra siempre dos decimales', () => {
    expect(formatPriceCents(0)).toBe(`0,00${NBSP}€`)
    expect(formatPriceCents(400)).toBe(`4,00${NBSP}€`)
  })

  it('usa punto de miles a partir de cinco cifras, como marca la norma es-ES', () => {
    expect(formatPriceCents(123456)).toBe(`1234,56${NBSP}€`)
    expect(formatPriceCents(1234567)).toBe(`12.345,67${NBSP}€`)
  })
})
