import { api } from './client'
import type { AdminStats } from '../../types/admin'
import type { AdminUser, UserRole } from '../../types/user'

export function fetchAdminStats(token: string): Promise<AdminStats> {
  return api.get<AdminStats>('/admin/stats', { token })
}

export function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  return api.get<AdminUser[]>('/admin/users', { token })
}

export function updateAdminUser(
  id: number,
  data: { role?: UserRole; is_active?: boolean },
  token: string,
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${id}`, data, { token })
}