import { useParams } from 'react-router'
import { useProducts } from '../hooks/useProducts'
import { AdminProductForm } from '../components/AdminProductForm'
import { usePageTitle } from '../hooks/usePageTitle'

// Una sola página para /admin/products/new (sin :id) y
// /admin/products/:id/edit. En edición se espera a tener el producto
// antes de montar el formulario: así los valores iniciales ya son los
// correctos y no hace falta sincronizarlos con un efecto.
export function AdminProductFormPage() {
  usePageTitle('Admin · Producto')
  const { id } = useParams()
  const { data: products, isLoading, isError } = useProducts()

  if (id === undefined) {
    return (
      <section>
        <h1 className="mb-6 text-2xl font-semibold">Nuevo producto</h1>
        <AdminProductForm />
      </section>
    )
  }

  if (isLoading) return <p className="text-muted-foreground">Cargando producto…</p>
  if (isError || !products) return <p className="text-ember">No se ha podido cargar el producto.</p>

  const product = products.find((item) => item.id === Number(id))
  if (!product) return <p className="text-ember">Producto no encontrado.</p>

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Editar: {product.name}</h1>
      <AdminProductForm product={product} />
    </section>
  )
}