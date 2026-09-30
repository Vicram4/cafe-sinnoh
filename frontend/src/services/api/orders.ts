import { api } from './client'
import type { Order, OrderCreatePayload } from '../../types/order'

export function createOrder(payload: OrderCreatePayload, token: string): Promise<Order> {
  return api.post<Order>('/orders', payload, { token })
}