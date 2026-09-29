import { type HTMLAttributes } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

// Insignias tipo "sello": borde de color + texto del mismo color, sin
// relleno sólido ni esquinas redondeadas. "danger" usa el tono cálido
// de marca (ember) en vez de un rojo genérico de sistema.
const tones: Record<Tone, string> = {
  neutral: 'border-border text-muted-foreground',
  accent: 'border-accent text-accent',
  success: 'border-primary text-primary',
  danger: 'border-ember text-ember',
}

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center border bg-surface px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    />
  )
}