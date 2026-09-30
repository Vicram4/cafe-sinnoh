import { api } from './client'
import type { Category, Product } from '../../types/product'

export function fetchCategories(): Promise<Category[]> {
  return api.get<Category[]>('/categories')
}

export function fetchProducts(): Promise<Product[]> {
  return api.get<Product[]>('/products')
}

export function fetchProductBySlug(slug: string): Promise<Product> {
  return api.get<Product>(`/products/${slug}`)
}