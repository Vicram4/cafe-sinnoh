export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1'

// Error propio: permite distinguir "no autorizado" (401), "conflicto"
// (409) etc. en las páginas que llaman a la API, sin tener que
// inspeccionar manualmente cada respuesta.
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  token?: string
}

async function request<T>(path: string, { token, headers, ...options }: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    // El backend siempre devuelve {"detail": "..."} en sus errores
    // (así lo definimos en cada HTTPException de FastAPI).
    const body = await response.json().catch(() => null)
    throw new ApiError(body?.detail ?? 'Ha ocurrido un error inesperado.', response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  // DELETE no lleva cuerpo; el backend responde 204 y `request` ya lo
  // convierte en undefined.
  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}