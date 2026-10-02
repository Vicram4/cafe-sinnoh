export type UserRole = 'USER' | 'ADMIN'

// Debe coincidir con el esquema UserRead del backend
// (backend/app/schemas/user.py). No incluye la contraseña ni su hash:
// la API nunca los envía.
export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
}

// Respuesta de GET /admin/users (UserAdminRead en el backend).
export interface AdminUser extends User {
  created_at: string
}