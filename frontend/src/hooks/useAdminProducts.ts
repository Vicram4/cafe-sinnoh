import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { createProduct, deleteProduct, updateProduct } from '../services/api/products'
import type { ProductCreateInput, ProductUpdateInput } from '../types/product'

// ['products'] invalida también ['products', slug] (React Query compara
// por prefijo), así que con esto se refrescan el listado público, el
// detalle y el carrito, que cruza sus líneas con este mismo catálogo.
function invalidateCatalog(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['products'] })
  queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
}

export function useCreateProduct() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductCreateInput) => createProduct(token!, data),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useUpdateProduct() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateInput }) =>
      updateProduct(token!, id, data),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useDeleteProduct() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProduct(token!, id),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}