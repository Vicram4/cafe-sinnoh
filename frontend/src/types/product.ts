// Coincide exactamente con los esquemas del backend (ProductRead,
// CategoryRead), snake_case incluido: así no hay ninguna capa de
// "traducción" oculta entre lo que la API envía y lo que usamos aquí.
export interface Category {
  id: number
  slug: string
  name: string
  sort_order: number
}

export interface Product {
  id: number
  slug: string
  name: string
  description: string
  price_cents: number
  image_url: string | null
  ingredients: string[]
  is_available: boolean
  is_featured: boolean
  inspiration_pokemon_name: string | null
  inspiration_pokedex_text: string | null
  inspiration_story: string | null
  location_name: string | null
  location_description: string | null
  category: Category
}

// Cuerpo de POST /products. Mismos nombres que ProductCreate del backend.
export interface ProductCreateInput {
  category_id: number
  slug: string
  name: string
  description: string
  price_cents: number
  image_url: string | null
  ingredients: string[]
  is_available: boolean
  is_featured: boolean
  inspiration_pokemon_name: string | null
  inspiration_pokedex_text: string | null
  inspiration_story: string | null
  location_name: string | null
  location_description: string | null
}

// Cuerpo de PATCH /products/{id}: todo opcional. Solo se envían los
// campos que cambian; un null explícito vacía el campo (p. ej. para
// pasar de inspiración Pokémon a lugar).
export type ProductUpdateInput = Partial<ProductCreateInput>