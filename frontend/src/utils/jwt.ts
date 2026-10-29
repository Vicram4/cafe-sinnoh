// Lee la fecha de caducidad ("exp", en segundos) de un JWT para saber
// cuándo renovarlo. No verifica la firma: eso lo hace siempre el backend.
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}
