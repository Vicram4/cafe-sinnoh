import { createContext } from 'react'
import type { Product } from '../types/product'

// Un CartLine combina el CartItem guardado (solo id + cantidad) con el
// producto real del catálogo, para que las páginas no tengan que hacer
// el cruce ellas mismas. "product: null" cubre el caso de un producto
// que se guardó en el carrito hace tiempo y ya no existe en el catálogo.
export interface CartLine {
  productId: number
  quantity: number
  product: Product | null
}

export interface CartContextValue {
  lines: CartLine[]
  totalItems: number
  subtotalCents: number
  addItem: (productId: number, quantity?: number) => void
  removeItem: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)