import { describe, expect, it } from 'vitest'
import { getTokenExpiry } from './jwt'

function base64url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('getTokenExpiry', () => {
  it('devuelve la caducidad en milisegundos', () => {
    expect(getTokenExpiry(`h.${base64url({ sub: 'a@b.com', exp: 1_900_000_000 })}.f`)).toBe(1_900_000_000_000)
  })

  it('devuelve null si el token no tiene caducidad o está mal formado', () => {
    expect(getTokenExpiry(`h.${base64url({ sub: 'a@b.com' })}.f`)).toBeNull()
    expect(getTokenExpiry('no-es-un-jwt')).toBeNull()
  })
})
