import { useEffect, useState, type ReactNode } from 'react'
import { CartContext, type CartLine } from './cart-context'
import type { CartItem } from '../types/cart'
import { useProducts } from '../hooks/useProducts'

const STORAGE_KEY = 'cafe-sinnoh:cart'

// Lee el carrito guardado en el navegador. Envuelto en try/catch porque
// localStorage puede fallar (modo incógnito con restricciones, cuota
// llena) o contener datos corruptos de una versión anterior del sitio;
// en cualquiera de esos casos, empezamos con un carrito vacío en vez
// de romper la página.
function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  // El carrito ya no depende de un array estático: usa la misma caché
  // de React Query que el resto de la app, así que si el catálogo
  // cambia (o aún está cargando), el carrito se mantiene coherente
  // con lo que ve el resto del sitio.
  const { data: products = [] } = useProducts()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Si falla el guardado (cuota llena, navegación privada estricta),
      // el carrito sigue funcionando en memoria durante la sesión.
    }
  }, [items])

  function addItem(productId: number, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { productId, quantity }]
    })
  }

  function removeItem(productId: number) {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }

  function setQuantity(productId: number, quantity: number) {
    if (quantity < 1) {
      removeItem(productId)
      return
    }
    setItems((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }

  function clearCart() {
    setItems([])
  }

  // Cruce con el catálogo, calculado en cada render a partir de
  // "items": nunca guardamos precio ni nombre, así que siempre reflejan
  // el catálogo actual.
  const lines: CartLine[] = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    product: products.find((product) => product.id === item.productId) ?? null,
  }))

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotalCents = lines.reduce(
    (sum, line) => sum + (line.product ? line.product.price_cents * line.quantity : 0),
    0,
  )

  return (
    <CartContext.Provider
      value={{ lines, totalItems, subtotalCents, addItem, removeItem, setQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}