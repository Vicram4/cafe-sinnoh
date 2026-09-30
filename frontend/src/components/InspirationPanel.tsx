import { SidePanel } from './SidePanel'

// Forma "aplanada" que construye ProductDetailPage a partir de los
// campos inspiration_* del producto (no viene directamente del tipo
// Product: ese ya no anida un objeto "inspiration", sino que tiene los
// campos sueltos, porque así los envía la API).
interface Inspiration {
  pokemonName: string
  pokedexText: string
  story: string
}

interface InspirationPanelProps {
  open: boolean
  onClose: () => void
  inspiration: Inspiration
}
export function InspirationPanel({ open, onClose, inspiration }: InspirationPanelProps) {
  return (
    <SidePanel open={open} onClose={onClose} title="Descubrir inspiración">
            <p className="font-serif text-lg italic text-accent">{inspiration.pokemonName}</p>

      <p className="mt-3 text-sm text-muted-foreground">{inspiration.pokedexText}</p>

      <div className="mt-4 rounded-xl bg-muted p-4">
        <p className="text-sm font-semibold">¿Por qué este producto?</p>
        <p className="mt-1 text-sm text-muted-foreground">{inspiration.story}</p>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Café Sinnoh es un proyecto de fans sin ánimo de lucro. No está afiliado a Nintendo,
        Game Freak ni The Pokémon Company.
      </p>
    </SidePanel>
  )
}