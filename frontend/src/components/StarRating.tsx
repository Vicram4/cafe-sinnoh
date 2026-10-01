interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
}

// Un único componente para dos casos: mostrar una puntuación (readOnly)
// o dejar elegirla (con onChange), evitando dos implementaciones
// casi idénticas de "cinco estrellas".
export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div role={readOnly ? undefined : 'radiogroup'} aria-label={readOnly ? undefined : 'Puntuación'}>
      {[1, 2, 3, 4, 5].map((star) =>
        readOnly ? (
          <span key={star} aria-hidden="true" className={star <= value ? 'text-accent' : 'text-border'}>
            ★
          </span>
        ) : (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} de 5 estrellas`}
            onClick={() => onChange?.(star)}
            className={`text-xl ${star <= value ? 'text-accent' : 'text-border'} hover:text-accent`}
          >
            ★
          </button>
        ),
      )}
    </div>
  )
}