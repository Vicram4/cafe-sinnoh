import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { products } from '../data/products'
import { categories } from '../data/categories'
import { formatPriceCents } from '../utils/format'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { InspirationPanel } from '../components/InspirationPanel'
import { PlaceholderPage } from './PlaceholderPage'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [inspirationOpen, setInspirationOpen] = useState(false)

  const product = products.find((item) => item.slug === slug)

  // Si alguien llega a una URL con un slug que no existe (enlace roto,
  // producto retirado del catálogo), mostramos un estado claro en vez
  // de una página en blanco o un error de JavaScript.
  if (!product) {
    return <PlaceholderPage title="Producto no encontrado" />
  }

  const category = categories.find((item) => item.slug === product.categorySlug)

  return (
    <section>
      <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a la carta
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex aspect-square items-center justify-center border border-border bg-muted text-muted-foreground">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span>Sin imagen</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {!product.isAvailable && <Badge tone="danger">Agotado</Badge>}
          </div>
                    {category && (
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">{category.name}</p>
          )}


          <p className="mt-4 text-2xl font-semibold text-primary">
            {formatPriceCents(product.priceCents)}
          </p>

          <p className="mt-4 text-foreground">{product.description}</p>

                    <div className="mt-4">
            <p className="text-sm font-semibold">Ingredientes</p>
            <p className="mt-1 text-sm text-muted-foreground">{product.ingredients.join(', ')}</p>
          </div>

          {/* Inspiración de lugar: se muestra directamente, sin panel ni
              aviso legal, porque no es contenido de Pokémon. */}
          {product.locationInspiration && (
            <p className="mt-3 text-sm italic text-muted-foreground">
              Inspirado en {product.locationInspiration.placeName}: {product.locationInspiration.description}
            </p>
          )}

          {/* El carrito real llega en la FASE 8; de momento el botón
              existe visualmente pero no hace nada todavía. */}
          <Button className="mt-6" disabled={!product.isAvailable}>
            {product.isAvailable ? 'Añadir al carrito' : 'No disponible'}
          </Button>

          {product.inspiration && (
            <div className="mt-6">
              <Button variant="secondary" onClick={() => setInspirationOpen(true)}>
                Descubrir inspiración
              </Button>
            </div>
          )}
        </div>
      </div>

      {product.inspiration && (
        <InspirationPanel
          open={inspirationOpen}
          onClose={() => setInspirationOpen(false)}
          inspiration={product.inspiration}
        />
      )}
    </section>
  )
}