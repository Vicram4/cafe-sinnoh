import { Link } from 'react-router'

// Franja discreta sobre la cabecera: deja claro en cada página que es una
// demo, sin competir con el hero (el único elemento llamativo de la web).
export function DemoBanner() {
  return (
    <p className="border-b border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
      Demo de portfolio: los pedidos no son reales y los datos se borran cada día. No uses datos
      personales.{' '}
      <Link to="/legal" className="underline underline-offset-2 hover:text-primary">
        Más información
      </Link>
    </p>
  )
}
