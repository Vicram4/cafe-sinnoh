import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePageTitle } from './usePageTitle'

describe('usePageTitle', () => {
  it('pone el título de la página seguido del nombre del sitio', () => {
    renderHook(() => usePageTitle('Carta'))

    expect(document.title).toBe('Carta · Café Sinnoh')
  })

  it('sin título deja solo el nombre del sitio (la Home)', () => {
    renderHook(() => usePageTitle())

    expect(document.title).toBe('Café Sinnoh')
  })

  it('se actualiza cuando cambia el título (p. ej. al cargar un producto)', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), { initialProps: { title: 'Carta' } })

    rerender({ title: 'Espresso Monte Corona' })

    expect(document.title).toBe('Espresso Monte Corona · Café Sinnoh')
  })
})
