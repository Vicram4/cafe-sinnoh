export interface Category {
  slug: string
  name: string
}

// La inspiración es opcional: no todos los productos tienen por qué
// tener un guiño a Sinnoh (briefing: debe complementar, no dominar).
export interface Inspiration {
  pokemonName: string
  pokedexText: string
  story: string
}

export interface Product {
  id: number
  slug: string
  name: string
  description: string
  // Precio en céntimos (entero), nunca en coma flotante. Cuando exista
  // backend, esta será también la unidad que use la base de datos.
  priceCents: number
  categorySlug: string
  imageUrl: string | null
  ingredients: string[]
  isAvailable: boolean
  isFeatured: boolean
  inspiration?: Inspiration
}