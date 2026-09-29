import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost'

// Sin esquinas redondeadas ni sombra: un botón con borde definido, como
// un sello o una ficha impresa, no una píldora de app. El color se
// "vacía" al hover en vez de aclararse, un tratamiento más propio de
// cartelería que de UI de SaaS.
const base =
  'inline-flex items-center justify-center border px-4 py-2 text-sm font-medium ' +
  'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'border-primary bg-primary text-primary-foreground hover:bg-transparent hover:text-primary',
  secondary: 'border-border bg-transparent text-foreground hover:border-primary hover:text-primary',
  ghost: 'border-transparent text-foreground hover:border-border',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

interface ButtonLinkProps extends LinkProps, Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  variant?: Variant
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}