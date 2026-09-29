import type { User } from '../../types/user'
import { API_BASE_URL, api, ApiError } from './client'

interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  // El endpoint de login sigue el estándar OAuth2 (application/x-www-
  // form-urlencoded con campos "username"/"password"), no JSON como el
  // resto de la API: es un requisito de OAuth2PasswordRequestForm en
  // el backend, no una elección nuestra.
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(data?.detail ?? 'No se pudo iniciar sesión.', response.status)
  }
  return response.json()
}

export function registerRequest(payload: RegisterPayload): Promise<User> {
  return api.post<User>('/auth/register', payload)
}

export function fetchCurrentUser(token: string): Promise<User> {
  return api.get<User>('/auth/me', { token })
}