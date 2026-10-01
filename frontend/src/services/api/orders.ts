import { api } from './client'
import type { Order, OrderCreatePayload, OrderStatus } from '../../types/order'

export function createOrder(payload: OrderCreatePayload, token: string): Promise<Order> {
  return api.post<Order>('/orders', payload, { token })
}

export function fetchMyOrders(token: string): Promise<Order[]> {
  return api.get<Order[]>('/orders', { token })
}

export function fetchAllOrders(token: string): Promise<Order[]> {
  return api.get<Order[]>('/orders/admin/all', { token })
}

export function updateOrderStatus(orderId: number, status: OrderStatus, token: string): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/status`, { status }, { token })
}