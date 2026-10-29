import { useTheme } from '../hooks/useTheme'

// Interruptor claro/oscuro con la identidad de la marca: rectangular, borde
// fino y sin sombras (no la típica píldora). El cuadro que se desplaza lleva
// el icono del modo activo. El deslizamiento solo se anima con
// "motion-safe", respetando prefers-reduced-motion.
export function ThemeToggle() {
  const { isDark, setTheme } = useTheme()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Modo oscuro"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-7 w-14 shrink-0 border border-border bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* Icono del modo contrario, visible en el hueco que deja el cuadro. */}
      <span aria-hidden="true" className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isDark ? 'left-1.5' : 'right-1.5'}`}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 flex h-[22px] w-[22px] items-center justify-center bg-primary text-primary-foreground motion-safe:transition-transform motion-safe:duration-200 ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  )
}
