import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useDeleteProduct, useUpdateProduct } from '../hooks/useAdminProducts'
import { formatPriceCents } from '../utils/format'
import { Badge } from '../components/Badge'
import { Button, ButtonLink } from '../components/Button'
import { ApiError } from '../services/api/client'
import type { Product } from '../types/product'
import { usePageTitle } from '../hooks/usePageTitle'

export function AdminProductsPage() {
  usePageTitle('Admin · Productos')
  const { data: products, isLoading, isError } = useProducts()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando productos…</p>
  if (isError || !products) return <p className="text-ember">No se han podido cargar los productos.</p>

  const busy = update.isPending || remove.isPending

  // Desactivar (is_available=false) es la vía normal para retirar un
  // producto: conserva el historial de pedidos y reseñas.
  function handleToggle(product: Product) {
    setError(null)
    update.mutate(
      { id: product.id, data: { is_available: !product.is_available } },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.') },
    )
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    remove.mutate(product.id, {
      onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo eliminar.'),
    })
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <ButtonLink to="/admin/products/new">Nuevo producto</ButtonLink>
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {products.map((product) => (
          <li key={product.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{product.name}</p>
              <div className="flex gap-2">
                {product.is_featured && <Badge tone="accent">Destacado</Badge>}
                <Badge tone={product.is_available ? 'success' : 'danger'}>
                  {product.is_available ? 'Disponible' : 'No disponible'}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.category.name} · {formatPriceCents(product.price_cents)} · /{product.slug}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink variant="secondary" to={`/admin/products/${product.id}/edit`}>
                Editar
              </ButtonLink>
              <Button variant="secondary" disabled={busy} onClick={() => handleToggle(product)}>
                {product.is_available ? 'Desactivar' : 'Activar'}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => handleDelete(product)}>
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {products.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay productos.</p>}
    </section>
  )
}