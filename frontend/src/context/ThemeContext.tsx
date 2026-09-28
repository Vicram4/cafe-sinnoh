import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme-context'

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