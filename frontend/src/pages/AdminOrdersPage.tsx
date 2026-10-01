import { useState } from 'react'
import { useAllOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders'
import { formatPriceCents } from '../utils/format'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ApiError } from '../services/api/client'
import type { OrderStatus } from '../types/order'

const statusTone: Record<OrderStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  CONFIRMED: 'accent',
  PREPARING: 'accent',
  READY: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY: 'Listo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

// Qué botón de "siguiente paso" mostrar según el estado actual: refleja
// la misma máquina de estados que ya valida el backend (ALLOWED_
// TRANSITIONS en services/orders.py). Si el backend rechazara igualmente
// un intento inválido, este mapa evita ni mostrar la opción.
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
}

export function AdminOrdersPage() {
  const { data: orders, isLoading, isError } = useAllOrders()
  const updateStatus = useUpdateOrderStatus()
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando pedidos…</p>
  if (isError || !orders) return <p className="text-ember">No se han podido cargar los pedidos.</p>

  const visibleOrders = filter === 'ALL' ? orders : orders.filter((order) => order.status === filter)

  function handleAdvance(orderId: number, current: OrderStatus) {
    const next = nextStatus[current]
    if (!next) return
    setError(null)
    updateStatus.mutate(
      { orderId, status: next },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.') },
    )
  }

  function handleCancel(orderId: number) {
    setError(null)
    updateStatus.mutate(
      { orderId, status: 'CANCELLED' },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo cancelar.') },
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const).map(
          (status) => (
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
              {status === 'ALL' ? 'Todos' : statusLabel[status]}
            </button>
          ),
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {visibleOrders.map((order) => (
          <li key={order.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                Pedido #{order.id} ·{' '}
                {new Date(order.pickup_at).toLocaleString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
            </div>
            <ul className="mt-2 text-sm text-muted-foreground">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.product_name}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-sm font-medium">{formatPriceCents(order.total_cents)}</p>

            <div className="mt-3 flex gap-2">
              {nextStatus[order.status] && (
                <Button
                  variant="secondary"
                  disabled={updateStatus.isPending}
                  onClick={() => handleAdvance(order.id, order.status)}
                >
                  Avanzar a {statusLabel[nextStatus[order.status]!]}
                </Button>
              )}
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <Button variant="ghost" disabled={updateStatus.isPending} onClick={() => handleCancel(order.id)}>
                  Cancelar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {visibleOrders.length === 0 && (
        <p className="mt-6 text-muted-foreground">No hay pedidos con ese estado.</p>
      )}
    </section>
  )
}