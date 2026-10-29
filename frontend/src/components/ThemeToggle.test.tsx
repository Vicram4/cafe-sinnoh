import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

// jsdom no implementa matchMedia: se simula el modo del sistema operativo.
function mockSystemDark(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
  return screen.getByRole('switch', { name: 'Modo oscuro' })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ThemeToggle', () => {
  it('sin elección guardada, sigue el modo del sistema operativo', () => {
    mockSystemDark(true)

    const toggle = renderToggle()

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('al pulsarlo cambia de modo y guarda la elección', async () => {
    mockSystemDark(true)
    const toggle = renderToggle()

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('una elección guardada tiene prioridad sobre el sistema', () => {
    mockSystemDark(true)
    localStorage.setItem('theme', 'light')

    const toggle = renderToggle()

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
