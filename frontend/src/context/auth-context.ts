import { createContext } from 'react'
import type { User } from '../types/user'
import type { RegisterPayload } from '../services/api/auth'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  // Mientras se intenta recuperar la sesión al cargar la página: las rutas
  // protegidas esperan en vez de mandar al login antes de tiempo.
  isInitializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)