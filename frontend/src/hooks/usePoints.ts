import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { fetchMyPoints, fetchRewards, redeemReward } from '../services/api/points'

export function useMyPoints() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['points', 'me'],
    queryFn: () => fetchMyPoints(token!),
    enabled: token !== null,
  })
}

export function useRewards() {
  return useQuery({ queryKey: ['rewards'], queryFn: fetchRewards })
}

export function useRedeemReward() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: number) => redeemReward(rewardId, token!),
    // Tras canjear, invalidamos la caché de puntos: la próxima vez que
    // se lea useMyPoints(), React Query vuelve a pedirlo al backend en
    // vez de mostrar el saldo desactualizado de antes del canje.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', 'me'] })
    },
  })
}