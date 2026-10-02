import { api } from './client'
import type { AdminReview, Review, ReviewCreatePayload, ReviewStatus } from '../../types/review'

export function fetchProductReviews(productId: number): Promise<Review[]> {
  return api.get<Review[]>(`/products/${productId}/reviews`)
}

export function fetchMyReviews(token: string): Promise<Review[]> {
  return api.get<Review[]>('/reviews/me', { token })
}

export function createReview(payload: ReviewCreatePayload, token: string): Promise<Review> {
  return api.post<Review>('/reviews', payload, { token })
}

export function fetchAllReviews(token: string): Promise<AdminReview[]> {
  return api.get<AdminReview[]>('/reviews/admin/all', { token })
}

export function moderateReview(reviewId: number, status: ReviewStatus, token: string): Promise<Review> {
  return api.patch<Review>(`/reviews/${reviewId}/moderate`, { status }, { token })
}