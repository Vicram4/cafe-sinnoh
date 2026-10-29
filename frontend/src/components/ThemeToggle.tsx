import type { Theme } from '../context/theme-context'
import { useTheme } from '../hooks/useTheme'

const options = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const

const labels: Record<Theme, string> = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' }
const nextTheme: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }

// Antes era un selector segmentado tipo píldora (bg-muted + botones
// redondeados). Ahora es una fila de texto con subrayado en la opción
// activa, más cerca de una etiqueta impresa que de un control de app.
// "compact": un solo botón que alterna los tres temas, para la cabecera de
// escritorio, donde las tres opciones a la vez no caben con sesión iniciada.
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme[theme])}
        aria-label={`Tema: ${labels[theme]}. Pulsa para cambiar a ${labels[nextTheme[theme]]}`}
        className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
      >
        Tema: <span className="font-semibold text-primary">{labels[theme]}</span>
      </button>
    )
  }

  return (
    <div role="radiogroup" aria-label="Tema de la aplicación" className="flex items-center gap-4 text-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={
            theme === option.value
              ? 'font-semibold text-primary underline decoration-2 underline-offset-4'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}