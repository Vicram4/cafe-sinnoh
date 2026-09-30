export interface PointTransaction {
  id: number
  points: number
  type: 'EARN' | 'REDEEM' | 'ADJUST'
  order_id: number | null
  reward_id: number | null
  description: string
  created_at: string
}

export interface PointsSummary {
  balance: number
  transactions: PointTransaction[]
}

export interface Reward {
  id: number
  name: string
  description: string
  cost_points: number
  is_active: boolean
}