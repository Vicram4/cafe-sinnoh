import { Link } from 'react-router'
import type { Product } from '../types/product'
import { formatPriceCents } from '../utils/format'
import { Card } from './Card'
import { Badge } from './Badge'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    // Toda la tarjeta es un enlace al detalle: mejor objetivo táctil en
    // móvil que un botón pequeño de "Ver más" al final.
    <Link to={`/menu/${product.slug}`}>
      <Card className="flex h-full flex-col">
        {/* Marcador neutro: se sustituirá por product.imageUrl cuando
            generes las ilustraciones finales. */}
                <div className="mb-3 flex aspect-square items-center justify-center border border-border bg-muted text-muted-foreground">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">Sin imagen</span>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{product.name}</h3>
          {!product.isAvailable && <Badge tone="danger">Agotado</Badge>}
        </div>

        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{product.description}</p>

        <p className="mt-3 font-semibold text-primary">{formatPriceCents(product.priceCents)}</p>
      </Card>
    </Link>
  )
}