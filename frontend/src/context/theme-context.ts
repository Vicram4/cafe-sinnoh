import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  theme: Theme
  // Modo efectivo: con theme "system" depende del sistema operativo.
  isDark: boolean
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)