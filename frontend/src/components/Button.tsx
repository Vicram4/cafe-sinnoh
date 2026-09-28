import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium ' +
  'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-muted text-foreground hover:bg-border',
  ghost: 'text-foreground hover:bg-muted',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

// Variante que se pinta como <Link> de React Router en vez de <button>.
// Necesaria para botones que navegan a otra ruta (p. ej. "Ver la carta"),
// porque un <a> real es más correcto ahí que un onClick con navigate().
interface ButtonLinkProps extends LinkProps, Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  variant?: Variant
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}