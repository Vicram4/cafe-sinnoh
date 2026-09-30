import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useProduct } from '../hooks/useProducts'
import { formatPriceCents } from '../utils/format'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { InspirationPanel } from '../components/InspirationPanel'
import { PlaceholderPage } from './PlaceholderPage'
import { useCart } from '../hooks/useCart'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [inspirationOpen, setInspirationOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem } = useCart()

  const { data: product, isLoading, isError } = useProduct(slug)

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Cargando producto…</p>
  }

  if (isError || !product) {
    return <PlaceholderPage title="Producto no encontrado" />
  }

  const hasPokemonInspiration = product.inspiration_pokemon_name !== null
  const hasLocationInspiration = product.location_name !== null

  return (
    <section>
      <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a la carta
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center border border-border bg-muted text-muted-foreground">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span>Sin imagen</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {!product.is_available && <Badge tone="danger">Agotado</Badge>}
          </div>

          <p className="mt-1 font-serif text-sm italic text-muted-foreground">{product.category.name}</p>

          <p className="mt-4 text-2xl font-semibold text-primary">{formatPriceCents(product.price_cents)}</p>

          <p className="mt-4 text-foreground">{product.description}</p>

          <div className="mt-4">
            <p className="text-sm font-semibold">Ingredientes</p>
            <p className="mt-1 text-sm text-muted-foreground">{product.ingredients.join(', ')}</p>
          </div>

          {hasLocationInspiration && (
            <p className="mt-3 text-sm italic text-muted-foreground">
              Inspirado en {product.location_name}: {product.location_description}
            </p>
          )}

          <Button
            className="mt-6"
            disabled={!product.is_available}
            onClick={() => {
              addItem(product.id)
              setJustAdded(true)
              setTimeout(() => setJustAdded(false), 2000)
            }}
          >
            {product.is_available ? 'Añadir al carrito' : 'No disponible'}
          </Button>
          {justAdded && (
            <p role="status" className="mt-2 text-sm text-primary">
              Añadido al carrito.
            </p>
          )}

          {hasPokemonInspiration && (
            <div className="mt-6">
              <Button variant="secondary" onClick={() => setInspirationOpen(true)}>
                Descubrir inspiración
              </Button>
            </div>
          )}
        </div>
      </div>

      {hasPokemonInspiration && (
        <InspirationPanel
          open={inspirationOpen}
          onClose={() => setInspirationOpen(false)}
          inspiration={{
            pokemonName: product.inspiration_pokemon_name!,
            pokedexText: product.inspiration_pokedex_text!,
            story: product.inspiration_story!,
          }}
        />
      )}
    </section>
  )
}