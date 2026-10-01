export interface Review {
  id: number
  product_id: number
  rating: number
  comment: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  author_name: string
}

export interface ReviewCreatePayload {
  product_id: number
  rating: number
  comment: string
}