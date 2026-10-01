import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCreateReview, useMyReviews, useProductReviews } from '../hooks/useReviews'
import { ApiError } from '../services/api/client'
import { StarRating } from './StarRating'
import { Button } from './Button'

interface ProductReviewsProps {
  productId: number
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated } = useAuth()
  const { data: reviews, isLoading } = useProductReviews(productId)
  const { data: myReviews } = useMyReviews()
  const createReview = useCreateReview()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Si ya existe una reseña propia para este producto (en cualquier
  // estado), no mostramos el formulario: el backend la rechazaría
  // igualmente, pero evitar el intento es mejor experiencia.
  const alreadyReviewed = myReviews?.some((review) => review.product_id === productId) ?? false

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFeedback(null)
    createReview.mutate(
      { product_id: productId, rating, comment },
      {
        onSuccess: () => {
          setFeedback({ type: 'success', message: 'Gracias. Tu reseña se publicará tras ser revisada.' })
          setRating(0)
          setComment('')
        },
        onError: (error) =>
          setFeedback({
            type: 'error',
            message: error instanceof ApiError ? error.message : 'No se pudo enviar la reseña.',
          }),
      },
    )
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-semibold">Reseñas</h2>

      {isLoading && <p className="mt-4 text-muted-foreground">Cargando reseñas…</p>}

      {!isLoading && reviews && reviews.length === 0 && (
        <p className="mt-4 text-muted-foreground">Todavía no hay reseñas de este producto.</p>
      )}

      {!isLoading && reviews && reviews.length > 0 && (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex items-center justify-between">
                <StarRating value={review.rating} readOnly />
                <span className="text-sm text-muted-foreground">{review.author_name}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated && !alreadyReviewed && (
        <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-3 border-t border-border pt-6">
          <p className="text-sm font-medium">¿Has probado este producto? Deja tu opinión.</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
            minLength={1}
            maxLength={1000}
            rows={3}
            placeholder="Cuéntanos qué te ha parecido…"
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
          />
          {feedback && (
            <p
              role="status"
              className={`border px-3 py-2 text-sm ${feedback.type === 'success' ? 'border-primary text-primary' : 'border-ember text-ember'}`}
            >
              {feedback.message}
            </p>
          )}
          <Button type="submit" disabled={rating === 0 || createReview.isPending} className="self-start">
            {createReview.isPending ? 'Enviando…' : 'Enviar reseña'}
          </Button>
        </form>
      )}

      {isAuthenticated && alreadyReviewed && (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          Ya has escrito una reseña para este producto. Gracias por tu opinión.
        </p>
      )}
    </section>
  )
}