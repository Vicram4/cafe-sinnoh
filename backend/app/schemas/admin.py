from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_orders: int
    total_revenue_cents: int
    orders_by_status: dict[str, int]
    pending_reviews_count: int
    new_applications_count: int
    unread_messages_count: int
    