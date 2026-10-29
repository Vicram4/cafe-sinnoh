import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  registerRequest,
  type RegisterPayload,
} from '../services/api/auth'
import type { User } from '../types/user'
import { getTokenExpiry } from '../utils/jwt'

// Pista no sensible ("hubo sesión") para no pedir una renovación en cada
// visita de alguien que nunca ha iniciado sesión: la cookie es HttpOnly y
// JavaScript no puede comprobar si existe.
const SESSION_HINT_KEY = 'cafe-sinnoh:has-session'
// Margen para renovar antes de que el access token caduque.
const REFRESH_MARGIN_MS = 60_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // El access token sigue viviendo solo en memoria (estado de React), nunca
  // en localStorage. Lo que sobrevive a una recarga es la cookie HttpOnly de
  // renovación, que JavaScript no puede leer.
  const [token, setToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(() => localStorage.getItem(SESSION_HINT_KEY) !== null)

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(SESSION_HINT_KEY)
  }, [])

  const applyToken = useCallback(async (accessToken: string) => {
    const currentUser = await fetchCurrentUser(accessToken)
    setToken(accessToken)
    setUser(currentUser)
    localStorage.setItem(SESSION_HINT_KEY, '1')
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { access_token } = await refreshAccessToken()
      await applyToken(access_token)
    } catch {
      clearSession()
    }
  }, [applyToken, clearSession])

  // Al cargar la página (F5 incluido): recuperar la sesión con la cookie.
  useEffect(() => {
    if (localStorage.getItem(SESSION_HINT_KEY) === null) return
    refreshAccessToken()
      .then(({ access_token }) => applyToken(access_token))
      .catch(clearSession)
      .finally(() => setIsInitializing(false))
  }, [applyToken, clearSession])

  // Renovación automática un poco antes de que caduque el access token. Al
  // volver a la pestaña (o tras suspender el equipo) se comprueba también,
  // porque los temporizadores pueden haberse retrasado.
  useEffect(() => {
    if (token === null) return
    const expiresAt = getTokenExpiry(token)
    if (expiresAt === null) return

    const refreshAt = expiresAt - REFRESH_MARGIN_MS
    const timer = setTimeout(() => void refreshSession(), Math.max(refreshAt - Date.now(), 0))
    function onVisible() {
      if (document.visibilityState === 'visible' && Date.now() > refreshAt) void refreshSession()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token, refreshSession])

  async function login(email: string, password: string) {
    const { access_token } = await loginRequest(email, password)
    await applyToken(access_token)
  }

  async function register(payload: RegisterPayload) {
    await registerRequest(payload)
    // Tras registrarse, iniciamos sesión automáticamente: mejor
    // experiencia que obligar a repetir el email y la contraseña.
    await login(payload.email, payload.password)
  }

  function logout() {
    // Cierre real: el backend revoca la sesión. Si la petición fallara, la
    // sesión se cierra igualmente en este navegador.
    void logoutRequest().catch(() => {})
    clearSession()
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: user !== null, isInitializing, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
