export interface AdminStats {
  total_users: number
  total_orders: number
  total_revenue_cents: number
  orders_by_status: Record<string, number>
  pending_reviews_count: number
  new_applications_count: number
  unread_messages_count: number
}