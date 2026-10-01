import { useAdminStats } from '../hooks/useAdminStats'
import { formatPriceCents } from '../utils/format'
import { Card } from '../components/Card'

const statusLabel: Record<string, string> = {
  PENDING: 'Pendientes',
  CONFIRMED: 'Confirmados',
  PREPARING: 'En preparación',
  READY: 'Listos',
  COMPLETED: 'Completados',
  CANCELLED: 'Cancelados',
}

export function AdminDashboardPage() {
  const { data: stats, isLoading, isError } = useAdminStats()

  if (isLoading) return <p className="text-muted-foreground">Cargando estadísticas…</p>
  if (isError || !stats) return <p className="text-ember">No se han podido cargar las estadísticas.</p>

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Usuarios</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total_users}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Pedidos totales</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total_orders}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Ingresos (completados)</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {formatPriceCents(stats.total_revenue_cents)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Reseñas pendientes</p>
          <p className="mt-1 text-2xl font-semibold">{stats.pending_reviews_count}</p>
        </Card>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Pedidos por estado</h2>
      <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
        {Object.entries(stats.orders_by_status).map(([status, count]) => (
          <li key={status} className="flex items-center justify-between py-2">
            <span>{statusLabel[status] ?? status}</span>
            <span className="font-medium">{count}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Pendiente de gestionar</h2>
      <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
        <li className="flex items-center justify-between py-2">
          <span>Candidaturas nuevas</span>
          <span className="font-medium">{stats.new_applications_count}</span>
        </li>
        <li className="flex items-center justify-between py-2">
          <span>Mensajes de contacto sin leer</span>
          <span className="font-medium">{stats.unread_messages_count}</span>
        </li>
      </ul>
    </section>
  )
}