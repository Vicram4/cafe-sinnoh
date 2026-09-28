import { type HTMLAttributes } from 'react'

// "hover:-translate-y-1" es el "movimiento ligero" que pide el briefing
// para las cards de producto: sutil, no una animación llamativa.
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'rounded-2xl border border-border bg-surface p-4 shadow-sm ' +
        'transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ' +
        className
      }
      {...props}
    />
  )
}