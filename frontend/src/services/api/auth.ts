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
  // Campo trampa anti-bots (ver HoneypotField): debe ir vacío.
  website?: string
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

// La cookie de renovación es HttpOnly: JavaScript no la ve, el navegador la
// envía solo (mismo origen). Cada renovación la rota, así que dos
// renovaciones simultáneas con la misma cookie parecerían un robo y el
// backend cerraría la sesión. Se evita en dos niveles: una sola petición a
// la vez en esta pestaña y un candado del navegador (Web Locks) entre
// pestañas; la que espera ya envía la cookie nueva.
let refreshInFlight: Promise<LoginResponse> | null = null

export function refreshAccessToken(): Promise<LoginResponse> {
  refreshInFlight ??= withRefreshLock(async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' })
    if (!response.ok) throw new ApiError('La sesión ha caducado.', response.status)
    return (await response.json()) as LoginResponse
  }).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('cafe-sinnoh-refresh', task)
  }
  return task()
}

export async function logoutRequest(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
}

export function registerRequest(payload: RegisterPayload): Promise<User> {
  return api.post<User>('/auth/register', payload)
}

export function fetchCurrentUser(token: string): Promise<User> {
  return api.get<User>('/auth/me', { token })
}