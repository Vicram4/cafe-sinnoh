import type { Inspiration } from '../types/product'
import { SidePanel } from './SidePanel'

interface InspirationPanelProps {
  open: boolean
  onClose: () => void
  inspiration: Inspiration
}

export function InspirationPanel({ open, onClose, inspiration }: InspirationPanelProps) {
  return (
    <SidePanel open={open} onClose={onClose} title="Descubrir inspiración">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        {inspiration.pokemonName}
      </p>

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