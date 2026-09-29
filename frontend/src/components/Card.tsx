import { type HTMLAttributes } from 'react'

// Borde fino en vez de sombra, esquina recta en vez de rounded-2xl. El
// hover cambia el color del borde, no eleva ni proyecta sombra: es
// "papel sobre una mesa", no una tarjeta flotante de app.
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'border border-border bg-surface p-4 transition-colors hover:border-primary/50 ' + className
      }
      {...props}
    />
  )
}