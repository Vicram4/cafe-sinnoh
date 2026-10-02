import { api } from './client'
import type {
  Category,
  Product,
  ProductCreateInput,
  ProductUpdateInput,
} from '../../types/product'

export function fetchCategories(): Promise<Category[]> {
  return api.get<Category[]>('/categories')
}

export function fetchProducts(): Promise<Product[]> {
  return api.get<Product[]>('/products')
}

export function fetchProductBySlug(slug: string): Promise<Product> {
  return api.get<Product>(`/products/${slug}`)
}

export function createProduct(token: string, data: ProductCreateInput): Promise<Product> {
  return api.post<Product>('/products', data, { token })
}

export function updateProduct(token: string, id: number, data: ProductUpdateInput): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, data, { token })
}

export function deleteProduct(token: string, id: number): Promise<void> {
  return api.delete<void>(`/products/${id}`, { token })
}