// Ruta relativa: la API se sirve en el mismo origen que la web (proxy de
// Vite en desarrollo, nginx en Docker y producción).
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

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

async function send(path: string, { token, headers, body, ...options }: RequestOptions = {}): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers: {
      // Con FormData no se fija Content-Type: el navegador lo pone él
      // mismo con el "boundary" que separa las partes del multipart.
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    // El backend siempre devuelve {"detail": "..."} en sus errores
    // (así lo definimos en cada HTTPException de FastAPI).
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(errorBody?.detail ?? 'Ha ocurrido un error inesperado.', response.status)
  }

  return response
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await send(path, options)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function serialize(body: unknown): BodyInit | undefined {
  if (body instanceof FormData) return body
  return body ? JSON.stringify(body) : undefined
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  // Para archivos (p. ej. el CV): la respuesta no es JSON.
  getBlob: (path: string, options?: RequestOptions) =>
    send(path, { ...options, method: 'GET' }).then((response) => response.blob()),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: serialize(body) }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: serialize(body) }),
  // DELETE no lleva cuerpo; el backend responde 204 y `request` ya lo
  // convierte en undefined.
  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}