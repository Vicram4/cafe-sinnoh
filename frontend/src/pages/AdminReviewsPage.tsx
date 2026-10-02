import { useState } from 'react'
import { useAllReviews, useModerateReview } from '../hooks/useAdminReviews'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ApiError } from '../services/api/client'
import type { ReviewStatus } from '../types/review'

const statusTone: Record<ReviewStatus, 'neutral' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const statusLabel: Record<ReviewStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export function AdminReviewsPage() {
  const { data: reviews, isLoading, isError } = useAllReviews()
  const moderate = useModerateReview()
  // Se abre en "Pendientes": es el trabajo real del moderador.
  const [filter, setFilter] = useState<ReviewStatus | 'ALL'>('PENDING')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando reseñas…</p>
  if (isError || !reviews) return <p className="text-ember">No se han podido cargar las reseñas.</p>

  const visibleReviews = filter === 'ALL' ? reviews : reviews.filter((review) => review.status === filter)

  function handleModerate(reviewId: number, status: ReviewStatus) {
    setError(null)
    moderate.mutate(
      { reviewId, status },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo moderar.') },
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Reseñas</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={
              filter === status
                ? 'border-b-2 border-primary pb-1 text-sm font-semibold text-primary'
                : 'border-b-2 border-transparent pb-1 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {status === 'ALL' ? 'Todas' : `${statusLabel[status]}s`}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {visibleReviews.map((review) => (
          <li key={review.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {review.product_name} · {review.rating}/5 ★
              </p>
              <Badge tone={statusTone[review.status]}>{statusLabel[review.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.author_name} ·{' '}
              {new Date(review.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="mt-2 text-sm">{review.comment}</p>

            <div className="mt-3 flex gap-2">
              {review.status !== 'APPROVED' && (
                <Button
                  variant="secondary"
                  disabled={moderate.isPending}
                  onClick={() => handleModerate(review.id, 'APPROVED')}
                >
                  Aprobar
                </Button>
              )}
              {review.status !== 'REJECTED' && (
                <Button
                  variant="ghost"
                  disabled={moderate.isPending}
                  onClick={() => handleModerate(review.id, 'REJECTED')}
                >
                  Rechazar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {visibleReviews.length === 0 && (
        <p className="mt-6 text-muted-foreground">No hay reseñas con ese estado.</p>
      )}
    </section>
  )
}