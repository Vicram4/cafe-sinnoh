import { NavLink, Outlet } from 'react-router'

// Navegación provisional para probar las rutas. La navbar real
// (responsive, con menú móvil, carrito y tema) llega en la FASE 3.
const links = [
  { to: '/', label: 'Inicio' },
  { to: '/menu', label: 'Carta' },
  { to: '/about', label: 'Nosotros' },
  { to: '/careers', label: 'Trabaja con nosotros' },
  { to: '/contact', label: 'Contacto' },
  { to: '/cart', label: 'Carrito' },
  { to: '/login', label: 'Entrar' },
]

// Un layout es una "plantilla" que envuelve varias páginas.
// <Outlet /> marca el hueco donde React Router pinta la página hija
// que corresponde a la URL actual; la cabecera se mantiene siempre.
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-amber-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav aria-label="Principal" className="mx-auto flex max-w-5xl flex-wrap gap-4 p-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              // "end" evita que "/" figure como activo en todas las rutas.
              end={link.to === '/'}
              className={({ isActive }) =>
                isActive ? 'font-bold text-sky-700' : 'text-slate-600 hover:text-sky-700'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}