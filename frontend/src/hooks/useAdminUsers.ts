import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchAdminUsers, updateAdminUser } from '../services/api/admin'
import type { UserRole } from '../types/user'

export function useAdminUsers() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers(token!),
    enabled: token !== null,
  })
}

export function useUpdateAdminUser() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: UserRole; is_active?: boolean } }) =>
      updateAdminUser(id, data, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}