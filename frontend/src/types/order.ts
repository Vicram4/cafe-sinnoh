// Coincide con los esquemas del backend (OrderCreate, OrderRead).
export interface OrderItemInput {
  product_id: number
  quantity: number
}

export interface OrderCreatePayload {
  items: OrderItemInput[]
  pickup_at: string
  notes?: string | null
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  unit_price_cents: number
  quantity: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface Order {
  id: number
  status: OrderStatus
  pickup_at: string
  subtotal_cents: number
  discount_cents: number
  total_cents: number
  notes: string | null
  created_at: string
  items: OrderItem[]
}