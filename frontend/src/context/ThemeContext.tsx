import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Decide si aplicar la clase "dark": explícita si el usuario eligió
// light/dark, o la del sistema operativo si eligió "system".
function resolveIsDark(theme: Theme) {
  if (theme === 'system') return getSystemPrefersDark()
  return theme === 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme | null) ?? 'system',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveIsDark(theme))
  }, [theme])

  // Si el usuario está en modo "system" y cambia el tema del SO en caliente
  // (sin recargar la página), reaccionamos también a ese cambio.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => document.documentElement.classList.toggle('dark', media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  function setTheme(next: Theme) {
    setThemeState(next)
    localStorage.setItem('theme', next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// Hook de conveniencia: lanza un error claro si se usa fuera del Provider,
// en vez de fallar de forma confusa más adelante.
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}