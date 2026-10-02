export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Review {
  id: number
  product_id: number
  rating: number
  comment: string
  status: ReviewStatus
  created_at: string
  author_name: string
}

// Respuesta de GET /reviews/admin/all (ReviewAdminRead en el backend).
export interface AdminReview extends Review {
  product_name: string
  product_slug: string
}

export interface ReviewCreatePayload {
  product_id: number
  rating: number
  comment: string
}