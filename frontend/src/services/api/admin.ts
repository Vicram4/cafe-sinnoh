import { api } from './client'
import type { AdminStats } from '../../types/admin'

export function fetchAdminStats(token: string): Promise<AdminStats> {
  return api.get<AdminStats>('/admin/stats', { token })
}