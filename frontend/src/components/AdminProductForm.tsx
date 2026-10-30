import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from '../utils/zod'
import { useNavigate } from 'react-router'
import { useCategories } from '../hooks/useProducts'
import { useCreateProduct, useUpdateProduct } from '../hooks/useAdminProducts'
import { ApiError } from '../services/api/client'
import { Button, ButtonLink } from './Button'
import type { Product, ProductCreateInput } from '../types/product'

// Misma restricción que SLUG_PATTERN del backend. Se repite aquí solo
// como ayuda de formato: el backend sigue siendo quien decide.
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PRICE_REGEX = /^\d+([.,]\d{1,2})?$/

const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Introduce el nombre.').max(150),
    slug: z
      .string()
      .min(1, 'Introduce el slug.')
      .max(120)
      .regex(SLUG_REGEX, 'Solo minúsculas, números y guiones simples (ej. espresso-monte-corona).'),
    category_id: z.string().min(1, 'Elige una categoría.'),
    description: z.string().trim().min(1, 'Introduce la descripción.').max(500),
    price: z.string().regex(PRICE_REGEX, 'Precio en euros, por ejemplo 4,50.'),
    image_url: z.string().max(500),
    ingredients: z.string(),
    is_available: z.boolean(),
    is_featured: z.boolean(),
    inspiration_kind: z.enum(['none', 'pokemon', 'place']),
    pokemon_name: z.string().max(100),
    pokedex_text: z.string().max(500),
    story: z.string().max(500),
    location_name: z.string().max(100),
    location_description: z.string().max(500),
  })
  .superRefine((values, ctx) => {
    // El nombre es el dato mínimo de cada tipo de inspiración.
    if (values.inspiration_kind === 'pokemon' && values.pokemon_name.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['pokemon_name'], message: 'Introduce el nombre del Pokémon.' })
    }
    if (values.inspiration_kind === 'place' && values.location_name.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['location_name'], message: 'Introduce el nombre del lugar.' })
    }
  })

type ProductFormValues = z.infer<typeof productSchema>

const inputClass = 'w-full border border-border bg-surface px-3 py-2 text-sm'
const errorClass = 'mt-1 text-sm text-ember'

const orNull = (value: string): string | null => (value.trim() === '' ? null : value.trim())

function toFormValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: '',
      slug: '',
      category_id: '',
      description: '',
      price: '',
      image_url: '',
      ingredients: '',
      is_available: true,
      is_featured: false,
      inspiration_kind: 'none',
      pokemon_name: '',
      pokedex_text: '',
      story: '',
      location_name: '',
      location_description: '',
    }
  }
  const hasPokemon = product.inspiration_pokemon_name !== null
  const hasPlace = product.location_name !== null
  return {
    name: product.name,
    slug: product.slug,
    category_id: String(product.category.id),
    description: product.description,
    price: (product.price_cents / 100).toFixed(2),
    image_url: product.image_url ?? '',
    ingredients: product.ingredients.join(', '),
    is_available: product.is_available,
    is_featured: product.is_featured,
    inspiration_kind: hasPokemon ? 'pokemon' : hasPlace ? 'place' : 'none',
    pokemon_name: product.inspiration_pokemon_name ?? '',
    pokedex_text: product.inspiration_pokedex_text ?? '',
    story: product.inspiration_story ?? '',
    location_name: product.location_name ?? '',
    location_description: product.location_description ?? '',
  }
}

// Convierte los valores del formulario (todo texto) en el cuerpo que
// espera la API. El grupo de inspiración no elegido se envía como null:
// así, al editar, se vacía el que ya no aplica y nunca llegan los dos
// grupos a la vez (el backend lo rechazaría con 422).
function toPayload(values: ProductFormValues): ProductCreateInput {
  const kind = values.inspiration_kind
  return {
    category_id: Number(values.category_id),
    slug: values.slug,
    name: values.name,
    description: values.description,
    // Math.round evita errores de coma flotante (19.99 * 100 = 1998.9999…).
    price_cents: Math.round(parseFloat(values.price.replace(',', '.')) * 100),
    image_url: orNull(values.image_url),
    ingredients: values.ingredients
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== ''),
    is_available: values.is_available,
    is_featured: values.is_featured,
    inspiration_pokemon_name: kind === 'pokemon' ? orNull(values.pokemon_name) : null,
    inspiration_pokedex_text: kind === 'pokemon' ? orNull(values.pokedex_text) : null,
    inspiration_story: kind === 'pokemon' ? orNull(values.story) : null,
    location_name: kind === 'place' ? orNull(values.location_name) : null,
    location_description: kind === 'place' ? orNull(values.location_description) : null,
  }
}

interface AdminProductFormProps {
  // Sin producto: modo alta. Con producto: modo edición.
  product?: Product
}

export function AdminProductForm({ product }: AdminProductFormProps) {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  })

  const kind = useWatch({ control, name: 'inspiration_kind' })
  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(values: ProductFormValues) {
    setServerError(null)
    const payload = toPayload(values)
    const callbacks = {
      onSuccess: () => navigate('/admin/products'),
      onError: (error: Error) =>
        setServerError(error instanceof ApiError ? error.message : 'No se pudo guardar el producto.'),
    }
    if (product) {
      updateMutation.mutate({ id: product.id, data: payload }, callbacks)
    } else {
      createMutation.mutate(payload, callbacks)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">Nombre</label>
        <input id="name" className={inputClass} {...register('name')} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium">Slug (URL)</label>
        <input id="slug" className={inputClass} {...register('slug')} />
        {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category_id" className="mb-1 block text-sm font-medium">Categoría</label>
          <select id="category_id" className={inputClass} {...register('category_id')}>
            <option value="">Selecciona…</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className={errorClass}>{errors.category_id.message}</p>}
        </div>
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">Precio (€)</label>
          <input id="price" inputMode="decimal" className={inputClass} {...register('price')} />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea id="description" rows={3} className={inputClass} {...register('description')} />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="ingredients" className="mb-1 block text-sm font-medium">
          Ingredientes (separados por comas)
        </label>
        <input id="ingredients" className={inputClass} {...register('ingredients')} />
      </div>

      <div>
        <label htmlFor="image_url" className="mb-1 block text-sm font-medium">URL de imagen (opcional)</label>
        <input id="image_url" className={inputClass} {...register('image_url')} />
        {errors.image_url && <p className={errorClass}>{errors.image_url.message}</p>}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_available')} /> Disponible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_featured')} /> Destacado
        </label>
      </div>

      <fieldset className="border border-border p-4">
        <legend className="px-1 text-sm font-medium">Inspiración</legend>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="none" {...register('inspiration_kind')} /> Ninguna
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="pokemon" {...register('inspiration_kind')} /> Pokémon
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="place" {...register('inspiration_kind')} /> Lugar de Sinnoh
          </label>
        </div>

        {kind === 'pokemon' && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="pokemon_name" className="mb-1 block text-sm font-medium">Nombre del Pokémon</label>
              <input id="pokemon_name" className={inputClass} {...register('pokemon_name')} />
              {errors.pokemon_name && <p className={errorClass}>{errors.pokemon_name.message}</p>}
            </div>
            <div>
              <label htmlFor="pokedex_text" className="mb-1 block text-sm font-medium">Texto Pokédex</label>
              <textarea id="pokedex_text" rows={3} className={inputClass} {...register('pokedex_text')} />
            </div>
            <div>
              <label htmlFor="story" className="mb-1 block text-sm font-medium">Historia</label>
              <textarea id="story" rows={3} className={inputClass} {...register('story')} />
            </div>
          </div>
        )}

        {kind === 'place' && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="location_name" className="mb-1 block text-sm font-medium">Nombre del lugar</label>
              <input id="location_name" className={inputClass} {...register('location_name')} />
              {errors.location_name && <p className={errorClass}>{errors.location_name.message}</p>}
            </div>
            <div>
              <label htmlFor="location_description" className="mb-1 block text-sm font-medium">
                Descripción del lugar
              </label>
              <textarea id="location_description" rows={3} className={inputClass} {...register('location_description')} />
            </div>
          </div>
        )}
      </fieldset>

      {serverError && (
        <p role="alert" className="border border-ember px-3 py-2 text-sm text-ember">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        <ButtonLink variant="ghost" to="/admin/products">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  )
}