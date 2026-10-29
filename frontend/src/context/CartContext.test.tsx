import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from './auth-context'
import { GUEST_CART_KEY, LEGACY_CART_KEY, userCartKey } from './cart-context'
import { CartProvider } from './CartContext'
import { useCart } from '../hooks/useCart'
import type { User } from '../types/user'

vi.mock('../hooks/useProducts', () => ({ useProducts: () => ({ data: [] }) }))

function makeUser(id: number): User {
  return { id, email: `user${id}@example.com`, full_name: 'Test', phone: null, role: 'USER', is_active: true }
}

// El wrapper lee esta variable en cada render: cambiarla y llamar a
// rerender() simula iniciar o cerrar sesión.
let currentUser: User | null = null

function Wrapper({ children }: { children: ReactNode }) {
  const auth = { user: currentUser, token: currentUser ? 'token' : null, isAuthenticated: currentUser !== null }
  return (
    <AuthContext.Provider value={auth as AuthContextValue}>
      <CartProvider>{children}</CartProvider>
    </AuthContext.Provider>
  )
}

function renderCart() {
  return renderHook(() => useCart(), { wrapper: Wrapper })
}

function stored(key: string) {
  const raw = localStorage.getItem(key)
  return raw === null ? null : JSON.parse(raw)
}

function quantities(lines: { productId: number; quantity: number }[]) {
  return Object.fromEntries(lines.map((line) => [line.productId, line.quantity]))
}

beforeEach(() => {
  localStorage.clear()
  currentUser = null
})

describe('CartProvider', () => {
  it('guarda el carrito sin sesión bajo su propia clave', () => {
    const { result } = renderCart()

    act(() => result.current.addItem(1, 2))

    expect(stored(GUEST_CART_KEY)).toEqual([{ productId: 1, quantity: 2 }])
  })

  it('al iniciar sesión incorpora el carrito sin sesión quedándose con la cantidad mayor', () => {
    localStorage.setItem(userCartKey(7), JSON.stringify([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]))
    const { result, rerender } = renderCart()
    act(() => {
      result.current.addItem(1, 2) // lo mismo que ya había en la cuenta: no debe duplicarse
      result.current.addItem(3, 1)
    })

    currentUser = makeUser(7)
    rerender()

    expect(quantities(result.current.lines)).toEqual({ 1: 2, 2: 1, 3: 1 })
    expect(quantities(stored(userCartKey(7)))).toEqual({ 1: 2, 2: 1, 3: 1 })
    expect(stored(GUEST_CART_KEY)).toBeNull()
  })

  it('al cerrar sesión no muestra el carrito de la cuenta, pero lo conserva para la próxima vez', () => {
    currentUser = makeUser(7)
    const { result, rerender } = renderCart()
    act(() => result.current.addItem(1, 3))

    currentUser = null
    rerender()
    expect(result.current.lines).toEqual([])

    currentUser = makeUser(7)
    rerender()
    expect(quantities(result.current.lines)).toEqual({ 1: 3 })
  })

  it('cada cuenta tiene su propio carrito en el mismo navegador', () => {
    currentUser = makeUser(7)
    const { result, rerender } = renderCart()
    act(() => result.current.addItem(1, 3))

    currentUser = null
    rerender()
    currentUser = makeUser(8)
    rerender()

    expect(result.current.lines).toEqual([])
    expect(quantities(stored(userCartKey(7)))).toEqual({ 1: 3 })
  })

  it('incorpora el carrito de la versión anterior y borra la clave antigua', () => {
    localStorage.setItem(LEGACY_CART_KEY, JSON.stringify([{ productId: 5, quantity: 1 }]))

    const { result } = renderCart()

    expect(quantities(result.current.lines)).toEqual({ 5: 1 })
    expect(stored(LEGACY_CART_KEY)).toBeNull()
    expect(stored(GUEST_CART_KEY)).toEqual([{ productId: 5, quantity: 1 }])
  })

  it('ignora datos corruptos o con formato inválido', () => {
    localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify([{ productId: 1, quantity: 1 }, { productId: 'x', quantity: 1 }, { productId: 2, quantity: -3 }, null]),
    )
    localStorage.setItem(LEGACY_CART_KEY, '{no es json')

    const { result } = renderCart()

    expect(quantities(result.current.lines)).toEqual({ 1: 1 })
  })
})
