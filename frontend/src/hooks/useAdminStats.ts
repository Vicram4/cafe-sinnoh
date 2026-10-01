import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchAdminStats } from '../services/api/admin'

export function useAdminStats() {
  const { token, user } = useAuth()
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdminStats(token!),
    enabled: token !== null && user?.role === 'ADMIN',
  })
}