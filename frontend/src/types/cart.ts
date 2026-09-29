// Guardamos solo el id del producto y la cantidad, nunca el precio ni
// el nombre: esos siempre se leen en el momento desde el catálogo
// (data/products.ts ahora; la API real en el futuro), para que el
// carrito nunca muestre un precio desactualizado.
export interface CartItem {
  productId: number
  quantity: number
}