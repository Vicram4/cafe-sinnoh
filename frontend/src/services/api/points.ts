import { api } from './client'
import type { PointsSummary, Reward, PointTransaction } from '../../types/points'

export function fetchMyPoints(token: string): Promise<PointsSummary> {
  return api.get<PointsSummary>('/points/me', { token })
}

export function fetchRewards(): Promise<Reward[]> {
  return api.get<Reward[]>('/rewards')
}

export function redeemReward(rewardId: number, token: string): Promise<PointTransaction> {
  return api.post<PointTransaction>(`/rewards/${rewardId}/redeem`, undefined, { token })
}