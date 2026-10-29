import { NavLink, Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const links = [
  { to: '/account', label: 'Mis datos' },
  { to: '/account/orders', label: 'Mis pedidos' },
  { to: '/account/points', label: 'Mis puntos' },
]

export function AccountLayout() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <p className="text-muted-foreground">Cargando…</p>
  }

  // Igual que en el checkout: toda la zona de cuenta exige sesión.
  // Está aquí, en el layout, en vez de repetirlo en cada página hija.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div>
      <nav aria-label="Cuenta" className="flex gap-6 border-b border-border">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/account'}
            className={({ isActive }) =>
              isActive
                ? 'border-b-2 border-primary pb-2 text-sm font-semibold text-primary'
                : 'border-b-2 border-transparent pb-2 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}