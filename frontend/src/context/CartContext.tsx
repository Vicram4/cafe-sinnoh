import { useEffect, useState, type ReactNode } from 'react'
import { CartContext, GUEST_CART_KEY, LEGACY_CART_KEY, userCartKey, type CartLine } from './cart-context'
import type { CartItem } from '../types/cart'
import { useAuth } from '../hooks/useAuth'
import { useProducts } from '../hooks/useProducts'

// localStorage puede fallar (modo incógnito con restricciones, cuota
// llena) o contener datos corruptos o manipulados; en esos casos se
// descarta lo inválido en vez de romper la página.
function loadCart(key: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        Number.isInteger(item?.productId) && Number.isInteger(item?.quantity) && item.quantity > 0,
    )
  } catch {
    return []
  }
}

// Se queda con la cantidad MAYOR de cada producto, no con la suma: como la
// sesión se pierde al recargar, es habitual volver a añadir sin sesión lo
// que ya estaba en el carrito de la cuenta, y sumar lo duplicaría.
function mergeCarts(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = new Map(base.map((item) => [item.productId, item.quantity]))
  for (const { productId, quantity } of incoming) {
    merged.set(productId, Math.max(merged.get(productId) ?? 0, quantity))
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }))
}

// Solo lectura: lo que se incorpora aquí (carrito sin sesión o antiguo) se
// borra del navegador en el efecto de guardado, no durante el render.
function cartFor(key: string): CartItem[] {
  if (key === GUEST_CART_KEY) return mergeCarts(loadCart(GUEST_CART_KEY), loadCart(LEGACY_CART_KEY))
  return mergeCarts(loadCart(key), loadCart(GUEST_CART_KEY))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const key = user ? userCartKey(user.id) : GUEST_CART_KEY
  // Clave y contenido van juntos en el mismo estado: así nunca se guarda
  // el carrito de una cuenta bajo la clave de otra al cambiar de usuario.
  const [cart, setCart] = useState(() => ({ key, items: cartFor(key) }))
  if (cart.key !== key) {
    // Al iniciar o cerrar sesión se cambia de carrito en el mismo render
    // (patrón de React para ajustar estado cuando cambia un dato), sin
    // llegar a pintar el carrito anterior.
    setCart({ key, items: cartFor(key) })
  }
  const items = cart.items
  // El carrito ya no depende de un array estático: usa la misma caché
  // de React Query que el resto de la app, así que si el catálogo
  // cambia (o aún está cargando), el carrito se mantiene coherente
  // con lo que ve el resto del sitio.
  const { data: products = [] } = useProducts()

  useEffect(() => {
    try {
      localStorage.setItem(cart.key, JSON.stringify(cart.items))
      // Su contenido ya está incorporado en cart.items.
      if (cart.key !== GUEST_CART_KEY) localStorage.removeItem(GUEST_CART_KEY)
      localStorage.removeItem(LEGACY_CART_KEY)
    } catch {
      // Si falla el guardado (cuota llena, navegación privada estricta),
      // el carrito sigue funcionando en memoria durante la sesión.
    }
  }, [cart])

  function setItems(update: (current: CartItem[]) => CartItem[]) {
    setCart((current) => ({ ...current, items: update(current.items) }))
  }

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
    setItems(() => [])
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