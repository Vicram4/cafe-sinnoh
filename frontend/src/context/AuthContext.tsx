import { useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { fetchCurrentUser, loginRequest, registerRequest, type RegisterPayload } from '../services/api/auth'
import type { User } from '../types/user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // El token vive solo en memoria (estado de React), nunca en
  // localStorage: decisión tomada en la FASE 6 para reducir el riesgo
  // de robo de sesión por XSS. Consecuencia asumida: al recargar la
  // página se cierra la sesión; se revisará al decidir el despliegue
  // definitivo (cookie HttpOnly + refresh token, si hace falta).
  const [token, setToken] = useState<string | null>(null)

  async function login(email: string, password: string) {
    const { access_token } = await loginRequest(email, password)
    const currentUser = await fetchCurrentUser(access_token)
    setToken(access_token)
    setUser(currentUser)
  }

  async function register(payload: RegisterPayload) {
    await registerRequest(payload)
    // Tras registrarse, iniciamos sesión automáticamente: mejor
    // experiencia que obligar a repetir el email y la contraseña.
    await login(payload.email, payload.password)
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: user !== null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}