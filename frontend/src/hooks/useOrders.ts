import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchMyOrders } from '../services/api/orders'

export function useMyOrders() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['orders', 'me'],
    queryFn: () => fetchMyOrders(token!),
    enabled: token !== null,
  })
}