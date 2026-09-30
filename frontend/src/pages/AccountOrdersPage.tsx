import { useMyOrders } from '../hooks/useOrders'
import { formatPriceCents } from '../utils/format'
import { Badge } from '../components/Badge'
import type { OrderStatus } from '../types/order'

// Un tono de insignia por estado: da lectura rápida sin tener que leer
// la palabra completa cada vez. "danger" para CANCELLED es coherente
// con el resto del sitio (mismo tono que "Agotado").
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
  READY: 'Listo para recoger',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

export function AccountOrdersPage() {
  const { data: orders, isLoading, isError } = useMyOrders()

  if (isLoading) return <p className="text-muted-foreground">Cargando tus pedidos…</p>
  if (isError) return <p className="text-ember">No se han podido cargar tus pedidos.</p>

  if (!orders || orders.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <p className="mt-4 text-muted-foreground">Todavía no has hecho ningún pedido.</p>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Mis pedidos</h1>
      <ul className="mt-6 divide-y divide-border border-t border-border">
        {orders.map((order) => (
          <li key={order.id} className="py-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                Pedido #{order.id} ·{' '}
                {new Date(order.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
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
            <p className="mt-2 text-sm font-medium">{formatPriceCents(order.total_cents)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}