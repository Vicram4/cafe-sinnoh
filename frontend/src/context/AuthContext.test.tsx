import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'
import { fetchCurrentUser, loginRequest, logoutRequest, refreshAccessToken } from '../services/api/auth'
import type { User } from '../types/user'

vi.mock('../services/api/auth', () => ({
  fetchCurrentUser: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshAccessToken: vi.fn(),
  registerRequest: vi.fn(),
}))

const HINT = 'cafe-sinnoh:has-session'
const maria: User = { id: 2, email: 'maria@example.com', full_name: 'María', phone: null, role: 'USER', is_active: true }

// JWT de mentira con la caducidad indicada: el frontend solo lee "exp".
function tokenExpiringIn(seconds: number) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))
  return `cabecera.${payload}.firma`
}

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider> })
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.mocked(fetchCurrentUser).mockResolvedValue(maria)
  vi.mocked(logoutRequest).mockResolvedValue()
})

describe('AuthProvider', () => {
  it('sin sesión previa no intenta renovar ni hace esperar a la página', () => {
    const { result } = renderAuth()

    expect(result.current.isInitializing).toBe(false)
    expect(result.current.user).toBeNull()
    expect(refreshAccessToken).not.toHaveBeenCalled()
  })

  it('al recargar recupera la sesión con la cookie de renovación', async () => {
    localStorage.setItem(HINT, '1')
    vi.mocked(refreshAccessToken).mockResolvedValue({ access_token: tokenExpiringIn(1800), token_type: 'bearer' })

    const { result } = renderAuth()

    expect(result.current.isInitializing).toBe(true)
    await waitFor(() => expect(result.current.isInitializing).toBe(false))
    expect(result.current.user).toEqual(maria)
    expect(result.current.token).not.toBeNull()
  })

  it('si la sesión ya no es válida, queda sin sesión y olvida la pista', async () => {
    localStorage.setItem(HINT, '1')
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error('401'))

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.isInitializing).toBe(false))
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(HINT)).toBeNull()
  })

  it('login guarda la pista y logout cierra la sesión también en el servidor', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ access_token: tokenExpiringIn(1800), token_type: 'bearer' })
    const { result } = renderAuth()

    await act(() => result.current.login('maria@example.com', 'secreta'))
    expect(result.current.user).toEqual(maria)
    expect(localStorage.getItem(HINT)).toBe('1')

    act(() => result.current.logout())
    expect(logoutRequest).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(HINT)).toBeNull()
  })

  it('renueva el token automáticamente antes de que caduque', async () => {
    // Caduca en 61 s y se renueva 60 s antes: la renovación toca en ~1 s.
    vi.mocked(loginRequest).mockResolvedValue({ access_token: tokenExpiringIn(61), token_type: 'bearer' })
    vi.mocked(refreshAccessToken).mockResolvedValue({ access_token: tokenExpiringIn(1800), token_type: 'bearer' })
    const { result } = renderAuth()

    await act(() => result.current.login('maria@example.com', 'secreta'))

    await waitFor(() => expect(refreshAccessToken).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })
})
