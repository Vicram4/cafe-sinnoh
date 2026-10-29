import { Link } from 'react-router'

// Aviso junto a los formularios que recogen datos personales.
export function FormPrivacyNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Es una web de demostración: no uses datos reales. Más información en{' '}
      <Link to="/legal" className="underline underline-offset-2 hover:text-primary">
        Aviso legal y privacidad
      </Link>
      .
    </p>
  )
}
