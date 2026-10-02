import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchAllReviews, moderateReview } from '../services/api/reviews'
import type { ReviewStatus } from '../types/review'

export function useAllReviews() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => fetchAllReviews(token!),
    enabled: token !== null,
  })
}

export function useModerateReview() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: number; status: ReviewStatus }) =>
      moderateReview(reviewId, status, token!),
    onSuccess: () => {
      // ['reviews'] cubre por prefijo las reseñas públicas de cada
      // producto y "mis reseñas": aprobar o rechazar cambia lo que se
      // ve en la web.
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}