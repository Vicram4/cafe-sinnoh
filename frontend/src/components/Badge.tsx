import { type HTMLAttributes } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

// Tonos con significado: los usaremos para "Agotado" (danger), "Destacado"
// (accent), estados de pedido (success), etc. en fases posteriores.
const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
}

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    />
  )
}