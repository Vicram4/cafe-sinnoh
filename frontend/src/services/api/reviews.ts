import { api } from './client'
import type { Review, ReviewCreatePayload } from '../../types/review'

export function fetchProductReviews(productId: number): Promise<Review[]> {
  return api.get<Review[]>(`/products/${productId}/reviews`)
}

export function fetchMyReviews(token: string): Promise<Review[]> {
  return api.get<Review[]>('/reviews/me', { token })
}

export function createReview(payload: ReviewCreatePayload, token: string): Promise<Review> {
  return api.post<Review>('/reviews', payload, { token })
}