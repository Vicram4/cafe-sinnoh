import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { createReview, fetchMyReviews, fetchProductReviews } from '../services/api/reviews'
import type { ReviewCreatePayload } from '../types/review'

export function useProductReviews(productId: number) {
  return useQuery({
    queryKey: ['reviews', 'product', productId],
    queryFn: () => fetchProductReviews(productId),
  })
}

export function useMyReviews() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: () => fetchMyReviews(token!),
    enabled: token !== null,
  })
}

export function useCreateReview() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReviewCreatePayload) => createReview(payload, token!),
    onSuccess: () => {
      // Invalida "mis reseñas" (para reflejar la nueva, pendiente) y
      // las reseñas públicas del producto (aunque esta nueva no se
      // vea todavía, por si había otras ya aprobadas que mostrar).
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
    },
  })
}