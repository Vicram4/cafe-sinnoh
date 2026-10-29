import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme-context'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // "system" solo es el valor inicial: mientras el usuario no elija, se
  // sigue el modo del sistema operativo. Al pulsar el interruptor se guarda
  // "light" o "dark".
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme | null) ?? 'system',
  )
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches)

  // Si el sistema operativo cambia de modo en caliente (sin recargar), la
  // web lo sigue mientras el usuario no haya elegido uno.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const listener = () => setSystemDark(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const isDark = theme === 'system' ? systemDark : theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  function setTheme(next: Theme) {
    setThemeState(next)
    localStorage.setItem('theme', next)
  }

  return <ThemeContext.Provider value={{ theme, isDark, setTheme }}>{children}</ThemeContext.Provider>
}
