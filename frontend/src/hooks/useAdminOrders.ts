import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchAllOrders, updateOrderStatus } from '../services/api/orders'
import type { OrderStatus } from '../types/order'

export function useAllOrders() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => fetchAllOrders(token!),
    enabled: token !== null,
  })
}

export function useUpdateOrderStatus() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
      updateOrderStatus(orderId, status, token!),
    onSuccess: () => {
      // Refresca tanto el listado de admin como el dashboard (las
      // cifras de "pedidos por estado" cambian con cada transición).
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}