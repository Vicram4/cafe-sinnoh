import { useTheme } from '../context/ThemeContext'

const options = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div role="radiogroup" aria-label="Tema de la aplicación" className="flex gap-1 rounded-full border border-border bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={
            theme === option.value
              ? 'rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground'
              : 'rounded-full px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}