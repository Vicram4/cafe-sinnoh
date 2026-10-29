import { useMemo, useState } from 'react'
import { useCategories, useProducts } from '../hooks/useProducts'
import { ProductCard } from '../components/ProductCard'
import { usePageTitle } from '../hooks/usePageTitle'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
]

export function MenuPage() {
  usePageTitle('Carta')
  const [search, setSearch] = useState('')
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('featured')

  const { data: products, isLoading: productsLoading, isError: productsError } = useProducts()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

  const visibleProducts = useMemo(() => {
    if (!products) return []
    const term = search.trim().toLowerCase()

    const filtered = products.filter((product) => {
      const matchesSearch = term.length === 0 || product.name.toLowerCase().includes(term)
      const matchesCategory = categorySlug === null || product.category.slug === categorySlug
      return matchesSearch && matchesCategory
    })

    const sorted = [...filtered]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price_cents - b.price_cents)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price_cents - a.price_cents)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      case 'featured':
      default:
        sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    }
    return sorted
  }, [products, search, categorySlug, sort])

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
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
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
            className="w-full border border-border bg-surface px-3 py-2 text-sm md:w-56"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-6 overflow-x-auto border-b border-border">
        <button
          type="button"
          onClick={() => setCategorySlug(null)}
          aria-pressed={categorySlug === null}
          className={
            categorySlug === null
              ? 'shrink-0 border-b-2 border-primary pb-2 text-sm font-semibold text-primary'
              : 'shrink-0 border-b-2 border-transparent pb-2 text-sm text-muted-foreground hover:text-foreground'
          }
        >
          Todas
        </button>
        {!categoriesLoading &&
          categories?.map((category, index) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setCategorySlug(category.slug)}
              aria-pressed={categorySlug === category.slug}
              className={
                categorySlug === category.slug
                  ? 'shrink-0 border-b-2 border-primary pb-2 text-sm font-semibold text-primary'
                  : 'shrink-0 border-b-2 border-transparent pb-2 text-sm text-muted-foreground hover:text-foreground'
              }
            >
              <span className="mr-1 font-serif text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              {category.name}
            </button>
          ))}
      </div>

      {productsLoading && <p className="mt-8 text-center text-muted-foreground">Cargando carta…</p>}

      {productsError && (
        <p className="mt-8 text-center text-ember">
          No se ha podido cargar la carta. Comprueba tu conexión e inténtalo de nuevo.
        </p>
      )}

      {!productsLoading && !productsError && visibleProducts.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          No hay productos que coincidan con tu búsqueda.
        </p>
      )}

      {!productsLoading && !productsError && visibleProducts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}