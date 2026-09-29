// Debe coincidir con el esquema UserRead del backend
// (backend/app/schemas/user.py). No incluye la contraseña ni su hash:
// la API nunca los envía.
export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: 'USER' | 'ADMIN'
  is_active: boolean
}