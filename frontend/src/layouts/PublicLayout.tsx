import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { ThemeToggle } from '../components/ThemeToggle'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/menu', label: 'Carta' },
  { to: '/about', label: 'Nosotros' },
  { to: '/careers', label: 'Empleo' },
  { to: '/contact', label: 'Contacto' },
]

export function PublicLayout() {
  // Controla si el menú móvil (el desplegable con hamburguesa) está abierto.
  // En escritorio no se usa: ahí los enlaces siempre son visibles.
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <NavLink to="/" className="text-lg font-bold text-primary" onClick={() => setMenuOpen(false)}>
            Café Sinnoh
          </NavLink>

          {/* Enlaces de escritorio: ocultos por defecto, visibles desde "md" (≥768px) */}
          <nav aria-label="Principal" className="hidden gap-6 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <NavLink to="/cart" className="text-muted-foreground hover:text-foreground">
              Carrito
            </NavLink>
            <NavLink
              to="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Entrar
            </NavLink>
          </div>

          {/* Botón hamburguesa: solo visible por debajo de "md" */}
          <button
            type="button"
            className="md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Menú móvil: solo se pinta cuando está abierto, y solo por debajo de "md" */}
        {menuOpen && (
          <nav id="mobile-menu" aria-label="Principal (móvil)" className="border-t border-border p-4 md:hidden">
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/cart" onClick={() => setMenuOpen(false)} className="text-muted-foreground">
                Carrito
              </NavLink>
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Entrar
              </NavLink>
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}