import { useState } from 'react'
import { NavLink, Outlet, useNavigation } from 'react-router'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button, ButtonLink } from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { Footer } from '../components/Footer'

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
  const { user, logout, isInitializing } = useAuth()
  const { totalItems } = useCart()
  // Mientras se descarga el código de la página siguiente, el router
  // mantiene la actual en pantalla; esta señal indica que algo está pasando.
  const isLoadingPage = useNavigation().state === 'loading'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 p-4">
                    <NavLink
            to="/"
            className="shrink-0 whitespace-nowrap font-serif text-xl font-semibold text-primary"
            onClick={() => setMenuOpen(false)}
          >
            Café Sinnoh
          </NavLink>

          {/* Enlaces de escritorio: ocultos por defecto, visibles desde "lg" (≥1024px).
              Por debajo no caben junto a la cuenta y se usa el menú desplegable. */}
          <nav aria-label="Principal" className="hidden gap-5 whitespace-nowrap lg:flex">
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

          <div className="hidden items-center gap-4 whitespace-nowrap lg:flex">
            <ThemeToggle />
                                    <NavLink to="/cart" className="text-muted-foreground hover:text-foreground">
              Carrito{totalItems > 0 && ` (${totalItems})`}
            </NavLink>
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                    Admin
                  </NavLink>
                )}
                <NavLink
                  to="/account"
                  className="max-w-40 truncate text-sm text-muted-foreground hover:text-foreground"
                >
                  Hola, {user.full_name.split(' ')[0]}
                </NavLink>
                <Button variant="ghost" onClick={logout}>
                  Salir
                </Button>
              </div>
            ) : (
              // Mientras se recupera la sesión no se muestra nada, para no
              // enseñar "Entrar" un instante a quien ya tiene sesión.
              !isInitializing && <ButtonLink to="/login">Entrar</ButtonLink>
            )}
          </div>

          {/* Botón hamburguesa: solo visible por debajo de "lg" */}
          <button
            type="button"
            className="lg:hidden"
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

        {/* Menú móvil: solo se pinta cuando está abierto, y solo por debajo de "lg" */}
        {menuOpen && (
          <nav id="mobile-menu" aria-label="Principal (móvil)" className="border-t border-border p-4 lg:hidden">
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
                Carrito{totalItems > 0 && ` (${totalItems})`}
              </NavLink>
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                >
                  Salir ({user.full_name.split(' ')[0]})
                </Button>
              ) : (
                !isInitializing && (
                  <ButtonLink to="/login" onClick={() => setMenuOpen(false)} className="text-center">
                    Entrar
                  </ButtonLink>
                )
              )}
              <div className="flex items-center gap-3 pt-2">
                <ThemeToggle />
                <span aria-hidden="true" className="text-sm text-muted-foreground">
                  Modo oscuro
                </span>
              </div>
            </div>
          </nav>
        )}

        {/* Línea fija, sin animación: respeta prefers-reduced-motion por diseño. */}
        {isLoadingPage && (
          <>
            <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            <p role="status" className="sr-only">
              Cargando página…
            </p>
          </>
        )}
      </header>

            <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}