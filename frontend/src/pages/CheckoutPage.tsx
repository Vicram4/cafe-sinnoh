import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { createOrder } from '../services/api/orders'
import { ApiError } from '../services/api/client'
import { formatPriceCents } from '../utils/format'
import { Button, ButtonLink } from '../components/Button'
import { usePageTitle } from '../hooks/usePageTitle'

// Redondeamos al siguiente cuarto de hora y añadimos 20 minutos de
// margen, por encima del mínimo de 15 que exige el backend: da un
// primer valor cómodo en el selector sin que el usuario tenga que
// calcular la hora a mano desde el primer segundo.
function getDefaultPickupTime(): string {
  const date = new Date(Date.now() + 20 * 60 * 1000)
  const minutes = date.getMinutes()
  date.setMinutes(minutes + ((15 - (minutes % 15)) % 15))
  date.setSeconds(0)
  date.setMilliseconds(0)
  // El input datetime-local espera "YYYY-MM-DDTHH:mm" en hora local,
  // sin zona horaria; toISOString() da UTC, así que construimos el
  // texto a mano a partir de los componentes locales.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function CheckoutPage() {
  usePageTitle('Finalizar pedido')
  const { token, isAuthenticated, isInitializing } = useAuth()
  const { lines, subtotalCents, clearCart } = useCart()
  const navigate = useNavigate()

  const [pickupAt, setPickupAt] = useState(getDefaultPickupTime)
  const [notes, setNotes] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('No hay sesión activa.')
      return createOrder(
        {
          // El backend vuelve a calcular precios y valida disponibilidad
          // con estos datos: aquí solo enviamos qué y cuánto, nunca
          // precios ni nombres.
          items: lines
            .filter((line) => line.product !== null)
            .map((line) => ({ product_id: line.productId, quantity: line.quantity })),
          // new Date(pickupAt) interpreta el valor del input en hora
          // local; toISOString() lo convierte a UTC con zona horaria
          // explícita, tal como espera el backend.
          pickup_at: new Date(pickupAt).toISOString(),
          notes: notes.trim().length > 0 ? notes.trim() : null,
        },
        token,
      )
    },
    onSuccess: () => {
      clearCart()
    },
    onError: (error) => {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo crear el pedido.')
    },
  })

  if (isInitializing) {
    return <p className="text-muted-foreground">Cargando…</p>
  }
  // Debe ir antes que el resto de comprobaciones: sin sesión, ni
  // siquiera tiene sentido mostrar el formulario.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (mutation.isSuccess && mutation.data) {
    return (
      <section className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">¡Pedido confirmado!</h1>
        <p className="mt-3 text-muted-foreground">
          Tu pedido #{mutation.data.id} está en estado <strong>pendiente de confirmación</strong>. Te
          esperamos en Café Sinnoh a la hora indicada.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink to="/menu" variant="secondary">
            Seguir explorando la carta
          </ButtonLink>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </section>
    )
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-3 text-muted-foreground">Añade algo de la carta antes de finalizar un pedido.</p>
        <div className="mt-6">
          <ButtonLink to="/menu">Ver la carta</ButtonLink>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Finalizar pedido</h1>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {lines.map((line) =>
          line.product ? (
            <li key={line.productId} className="flex items-center justify-between py-3 text-sm">
              <span>
                {line.quantity} × {line.product.name}
              </span>
              <span>{formatPriceCents(line.product.price_cents * line.quantity)}</span>
            </li>
          ) : null,
        )}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-muted-foreground">Total</span>
        <span className="text-xl font-semibold">{formatPriceCents(subtotalCents)}</span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setServerError(null)
          mutation.mutate()
        }}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <div>
          <label htmlFor="pickupAt" className="mb-1 block text-sm font-medium">
            Hora de recogida
          </label>
          <input
            id="pickupAt"
            type="datetime-local"
            required
            value={pickupAt}
            onChange={(event) => setPickupAt(event.target.value)}
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Abrimos de 8:00 a 20:00. Necesitamos al menos 15 minutos para preparar tu pedido.
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium">
            Notas para el pedido (opcional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        {serverError && (
          <p role="alert" className="border border-ember px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={mutation.isPending} className="mt-2">
          {mutation.isPending ? 'Confirmando pedido…' : 'Confirmar pedido'}
        </Button>
      </form>
    </section>
  )
}