import { Link } from 'react-router'
import { useCart } from '../hooks/useCart'
import { formatPriceCents } from '../utils/format'
import { Button, ButtonLink } from '../components/Button'
import { Badge } from '../components/Badge'
import { usePageTitle } from '../hooks/usePageTitle'

export function CartPage() {
  usePageTitle('Carrito')
  const { lines, subtotalCents, setQuantity, removeItem, clearCart } = useCart()

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-3 text-muted-foreground">
          Todavía no has añadido ningún producto. Echa un vistazo a la carta para empezar.
        </p>
        <div className="mt-6">
          <ButtonLink to="/menu">Ver la carta</ButtonLink>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Tu carrito</h1>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {lines.map((line) => (
          <li key={line.productId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            {line.product === null ? (
              // Producto que estaba en el carrito pero ya no existe en
              // el catálogo (por ejemplo, se retiró del menú). Se
              // muestra el problema con claridad y solo se ofrece
              // quitarlo, no ajustar su cantidad.
              <div className="flex flex-1 items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Producto no disponible</p>
                  <Badge tone="danger" className="mt-1">
                    Retirado de la carta
                  </Badge>
                </div>
                <Button variant="ghost" onClick={() => removeItem(line.productId)}>
                  Quitar
                </Button>
              </div>
            ) : (
              <>
                <Link to={`/menu/${line.product.slug}`} className="flex flex-1 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-border bg-muted text-xs text-muted-foreground">
                    {line.product.image_url ? (
                      <img src={line.product.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      'Sin imagen'
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{line.product.name}</p>
                    {!line.product.is_available && (
                      <Badge tone="danger" className="mt-1">
                        Agotado
                      </Badge>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPriceCents(line.product.price_cents)}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 sm:justify-end">
                  <div
                    role="group"
                    aria-label={`Cantidad de ${line.product.name}`}
                    className="flex items-center border border-border"
                  >
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      aria-label="Reducir cantidad"
                      className="px-3 py-1 text-foreground hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="min-w-8 px-2 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      aria-label="Aumentar cantidad"
                      className="px-3 py-1 text-foreground hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  <p className="w-20 text-right text-sm font-medium">
                    {formatPriceCents(line.product.price_cents * line.quantity)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    aria-label={`Quitar ${line.product.name} del carrito`}
                    className="text-sm text-muted-foreground hover:text-ember"
                  >
                    Quitar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-4 border-t border-border pt-6">
        <div className="flex w-full max-w-xs items-baseline justify-between sm:w-auto sm:min-w-64">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-xl font-semibold">{formatPriceCents(subtotalCents)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          El precio final se confirma al iniciar el pedido para recoger en el local.
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button variant="ghost" onClick={clearCart}>
            Vaciar carrito
          </Button>
          <ButtonLink to="/menu" variant="secondary">
            Seguir comprando
          </ButtonLink>
          <ButtonLink to="/checkout">Ir al checkout</ButtonLink>
        </div>
      </div>
    </section>
  )
}