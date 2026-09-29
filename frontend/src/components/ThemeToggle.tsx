import { useTheme } from '../hooks/useTheme'

const options = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const

// Antes era un selector segmentado tipo píldora (bg-muted + botones
// redondeados). Ahora es una fila de texto con subrayado en la opción
// activa, más cerca de una etiqueta impresa que de un control de app.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

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