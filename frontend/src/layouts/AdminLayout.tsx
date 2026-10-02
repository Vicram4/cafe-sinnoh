import { NavLink, Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// Lista deliberadamente corta por ahora: cada bloque siguiente de la
// FASE 12 añade aquí su propio enlace, a medida que la página
// correspondiente exista. Mejor eso que enlaces a páginas inexistentes.
const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/orders', label: 'Pedidos' },
  { to: '/admin/products', label: 'Productos' },
  { to: '/admin/reviews', label: 'Reseñas' },
  { to: '/admin/applications', label: 'Candidaturas' },
  { to: '/admin/messages', label: 'Mensajes' },
]

export function AdminLayout() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  // Distinto de AccountLayout: aquí no basta con tener sesión, hace
  // falta el rol ADMIN. Un usuario normal que intente entrar va a la
  // Home, sin ningún mensaje de error que confirme que /admin existe.
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
      <nav aria-label="Administración" className="flex gap-4 border-b border-border pb-2 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            className={({ isActive }) =>
              isActive ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  )
}