import { useMemo, useState } from 'react'
import { products } from '../data/products'
import { categories } from '../data/categories'
import { ProductCard } from '../components/ProductCard'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
]

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('featured')

  // useMemo evita recalcular el listado filtrado en cada render que no
  // dependa de estos valores (por ejemplo, si más adelante el layout
  // añade un estado propio que no afecta al listado).
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    const filtered = products.filter((product) => {
      const matchesSearch = term.length === 0 || product.name.toLowerCase().includes(term)
      const matchesCategory = categorySlug === null || product.categorySlug === categorySlug
      return matchesSearch && matchesCategory
    })

    const sorted = [...filtered]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.priceCents - b.priceCents)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.priceCents - a.priceCents)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      case 'featured':
      default:
        // Los destacados primero; dentro de cada grupo, se respeta el
        // orden del catálogo.
        sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    }
    return sorted
  }, [search, categorySlug, sort])

  return (
    <section>
      <h1 className="text-2xl font-bold">Nuestra carta</h1>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-xs">
          <label htmlFor="search" className="mb-1 block text-sm font-medium">
            Buscar
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Espresso, tarta, pack..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="w-full md:w-auto">
          <label htmlFor="sort" className="mb-1 block text-sm font-medium">
            Ordenar por
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm md:w-56"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro de categorías: chips horizontales con scroll propio, para
          que en móvil no rompan el layout ni obliguen a hacer scroll
          vertical de toda la página. */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setCategorySlug(null)}
          aria-pressed={categorySlug === null}
          className={
            categorySlug === null
              ? 'shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground'
              : 'shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground'
          }
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => setCategorySlug(category.slug)}
            aria-pressed={categorySlug === category.slug}
            className={
              categorySlug === category.slug
                ? 'shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground'
                : 'shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground'
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          No hay productos que coincidan con tu búsqueda.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}