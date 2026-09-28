import { useContext } from 'react'
import { ThemeContext } from '../context/theme-context'

// Hook de conveniencia: lanza un error claro si se usa fuera del Provider,
// en vez de fallar de forma confusa más adelante.
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}