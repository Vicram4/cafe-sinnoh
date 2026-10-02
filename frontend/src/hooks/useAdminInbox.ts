import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchApplications, updateApplicationStatus } from '../services/api/careers'
import { fetchContactMessages, setMessageRead } from '../services/api/contact'
import type { ApplicationStatus } from '../types/inbox'

export function useApplications() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['admin', 'applications'],
    queryFn: () => fetchApplications(token!),
    enabled: token !== null,
  })
}

export function useUpdateApplicationStatus() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useContactMessages() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['admin', 'messages'],
    queryFn: () => fetchContactMessages(token!),
    enabled: token !== null,
  })
}

export function useSetMessageRead() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) => setMessageRead(id, isRead, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}