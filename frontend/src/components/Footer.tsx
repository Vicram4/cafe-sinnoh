import { Link } from 'react-router'
import { shopInfo } from '../data/shop'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 p-6 sm:grid-cols-3">
        <div>
          <p className="font-bold text-primary">{shopInfo.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{shopInfo.address}</p>
          <p className="mt-1 text-sm text-muted-foreground">{shopInfo.phone}</p>
          <p className="mt-1 text-sm text-muted-foreground">{shopInfo.email}</p>
        </div>

        <div>
          <p className="font-semibold">Horario</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {shopInfo.hours.map((entry) => (
              <li key={entry.days}>
                {entry.days}: {entry.time}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold">Enlaces</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link to="/menu" className="text-muted-foreground hover:text-foreground">
                Carta
              </Link>
            </li>
            <li>
              <Link to="/careers" className="text-muted-foreground hover:text-foreground">
                Trabaja con nosotros
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">
                Contacto
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <p className="border-t border-border p-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {shopInfo.name}. Proyecto de fans sin ánimo de lucro, no afiliado a
        Nintendo, Game Freak ni The Pokémon Company.
      </p>
    </footer>
  )
}