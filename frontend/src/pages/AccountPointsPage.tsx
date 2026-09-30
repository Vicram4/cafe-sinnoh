import { useState } from 'react'
import { useMyPoints, useRedeemReward, useRewards } from '../hooks/usePoints'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ApiError } from '../services/api/client'

export function AccountPointsPage() {
  const { data: points, isLoading: pointsLoading } = useMyPoints()
  const { data: rewards, isLoading: rewardsLoading } = useRewards()
  const redeem = useRedeemReward()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleRedeem(rewardId: number, rewardName: string) {
    setFeedback(null)
    redeem.mutate(rewardId, {
      onSuccess: () => setFeedback({ type: 'success', message: `Has canjeado "${rewardName}".` }),
      onError: (error) =>
        setFeedback({
          type: 'error',
          message: error instanceof ApiError ? error.message : 'No se pudo canjear la recompensa.',
        }),
    })
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Mis puntos</h1>

      <div className="mt-4 border border-border p-4">
        <p className="text-sm text-muted-foreground">Saldo actual</p>
        <p className="text-3xl font-semibold text-primary">
          {pointsLoading ? '…' : (points?.balance ?? 0)} <span className="text-base font-normal">puntos</span>
        </p>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Recompensas disponibles</h2>
      {feedback && (
        <p
          role="status"
          className={`mt-3 border px-3 py-2 text-sm ${feedback.type === 'success' ? 'border-primary text-primary' : 'border-ember text-ember'}`}
        >
          {feedback.message}
        </p>
      )}
      {rewardsLoading ? (
        <p className="mt-4 text-muted-foreground">Cargando recompensas…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rewards?.map((reward) => {
            const canAfford = (points?.balance ?? 0) >= reward.cost_points
            return (
              <Card key={reward.id} className="flex flex-col">
                <p className="font-semibold">{reward.name}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{reward.description}</p>
                <p className="mt-3 text-sm font-medium">{reward.cost_points} puntos</p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  disabled={!canAfford || redeem.isPending}
                  onClick={() => handleRedeem(reward.id, reward.name)}
                >
                  {canAfford ? 'Canjear' : 'Puntos insuficientes'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold">Historial</h2>
      {points && points.transactions.length > 0 ? (
        <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
          {points.transactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between py-2">
              <span>{transaction.description}</span>
              <span className={transaction.points > 0 ? 'text-primary' : 'text-ember'}>
                {transaction.points > 0 ? '+' : ''}
                {transaction.points}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-muted-foreground">Todavía no tienes movimientos.</p>
      )}
    </section>
  )
}