import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchProductBySlug, fetchProducts } from '../services/api/products'

// La "queryKey" identifica esta petición en la caché de React Query:
// dos componentes que llamen a useProducts() a la vez comparten la
// misma petición y el mismo resultado, en vez de duplicar la llamada.
export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: fetchProducts })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProductBySlug(slug!),
    // enabled evita lanzar la petición si todavía no hay slug (por
    // ejemplo, durante el primer render antes de leer los parámetros
    // de la URL).
    enabled: slug !== undefined,
  })
}