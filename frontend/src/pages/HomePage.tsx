import { Link } from 'react-router'
import { useCategories, useProducts } from '../hooks/useProducts'
// Reseñas de ejemplo: la API real de reseñas es por producto
// (GET /products/{id}/reviews), no existe todavía un endpoint que
// liste "las mejores reseñas de cualquier producto" para la Home.
// Las reseñas reales ya funcionan en el detalle de cada producto
// (ProductReviews). Si se quiere mostrar reseñas reales aquí, haría
// falta un endpoint agregado nuevo en el backend.
import { exampleReviews } from '../data/reviews'
import { shopInfo } from '../data/shop'
import { ProductCard } from '../components/ProductCard'
import { ButtonLink } from '../components/Button'
import { HeroScene } from '../components/HeroScene'
import { usePageTitle } from '../hooks/usePageTitle'

export function HomePage() {
  usePageTitle()
  const { data: products } = useProducts()
  const { data: categories } = useCategories()
  const featuredProducts = products?.filter((product) => product.is_featured) ?? []
  const [firstReview, ...restReviews] = exampleReviews

  return (
    <div className="flex flex-col">
      {/* Hero: composición asimétrica, nada centrado. La ilustración ocupa
          toda la altura de la columna derecha; es el único momento de
          protagonismo visual de la página. */}
      <section className="grid grid-cols-1 items-stretch gap-8 border-b border-border pb-12 md:grid-cols-2 md:gap-0">
        <div className="flex flex-col justify-center py-8 md:pr-10">
          <h1 className="text-4xl font-semibold sm:text-5xl">Café Sinnoh</h1>
          <p className="mt-4 max-w-md text-foreground">
            Café de especialidad y algo de cuaderno de viaje. Cada rincón de la carta esconde
            una pequeña historia; solo hay que fijarse un poco.
          </p>
          <div className="mt-6">
            <ButtonLink to="/menu">Ver la carta</ButtonLink>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            {shopInfo.address} · {shopInfo.hours[0].time}
          </p>
        </div>

        {/* Cuadrado en móvil: con un hueco apaisado se recortaría la cumbre.
            Borde fino como el de las tarjetas: la ilustración se lee como una
            página de cuaderno colocada a propósito, en modo claro y oscuro. */}
        <div className="aspect-square overflow-hidden border border-border md:aspect-auto">
          <HeroScene className="h-full w-full" />
        </div>
      </section>

      {/* Presentación: columna estrecha alineada a la izquierda, como un
          párrafo de cuaderno de campo, no un bloque centrado. */}
      <section className="border-b border-border py-12">
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold">Un café con algo más</h2>
          <p className="mt-4 text-foreground">
            Café Sinnoh nació como un pequeño homenaje a los viajes: a los que se hacen
            explorando nuevas rutas y a los que se hacen con una taza en la mano. Detrás de
            algunos nombres de la carta hay una historia curiosa, pensada para quien se pare a
            leerla.
          </p>
        </div>
      </section>

      {/* Categorías como paradas de una ruta: la numeración tiene sentido
          temático (son paradas reales de un recorrido), no es decoración
          01/02/03 puesta porque sí. */}
      <section className="border-b border-border py-12">
        <h2 className="text-2xl font-semibold">La ruta de la carta</h2>
        <ul className="mt-6 divide-y divide-border border-t border-border">
          {(categories ?? []).map((category, index) => (
            <li key={category.slug}>
              <Link
                to="/menu"
                className="flex items-baseline justify-between py-3 text-foreground hover:text-primary"
              >
                <span>
                  <span className="mr-3 font-serif text-sm text-muted-foreground">
                    Ruta {String(index + 1).padStart(2, '0')}
                  </span>
                  {category.name}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Destacados: retícula editorial. El primer producto ocupa más
          espacio que el resto (grid-flow-dense reordena el hueco sin
          dejar huecos vacíos), en vez de una cuadrícula uniforme. */}
      <section className="border-b border-border py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Destacados</h2>
          <Link to="/menu" className="text-sm text-muted-foreground hover:text-primary">
            Ver toda la carta →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-flow-dense lg:grid-cols-3">
          {featuredProducts.map((product, index) => (
            <div key={product.id} className={index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className="border-b border-border py-12">
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold">Nuestra historia</h2>
          <p className="mt-4 text-foreground">
            Todo empezó con la idea de unir dos pasiones: el café y la exploración. El local
            está lleno de guiños a rutas, lagos y rincones que solo los más curiosos llegan a
            reconocer del todo. No hace falta conocerlos para disfrutar de la carta, pero quien
            se fija, encuentra algo más.
          </p>
        </div>
      </section>

      {/* Programa de puntos */}
      <section className="border-b border-border py-12">
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold">Programa de puntos</h2>
          <p className="mt-4 text-foreground">
            Acumula puntos con cada pedido y canjéalos por recompensas. Solo hace falta una
            cuenta gratuita.
          </p>
          <div className="mt-6">
            <ButtonLink to="/register" variant="secondary">
              Crear cuenta
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Reseñas: una cita grande destacada y el resto en una lista más
          discreta, en vez de tres tarjetas idénticas en fila. */}
      <section className="border-b border-border py-12">
        <h2 className="text-2xl font-semibold">Lo que dicen de nosotros</h2>

        {firstReview && (
          <blockquote className="mt-6 max-w-xl border-l-2 border-primary pl-6">
            <p className="font-serif text-xl italic text-foreground">"{firstReview.comment}"</p>
            <footer className="mt-3 text-sm text-muted-foreground">
              {firstReview.author} · {firstReview.rating}/5
            </footer>
          </blockquote>
        )}

        {restReviews.length > 0 && (
          <ul className="mt-8 max-w-xl divide-y divide-border border-t border-border">
            {restReviews.map((review) => (
              <li key={review.id} className="py-3">
                <p className="text-sm text-foreground">"{review.comment}"</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {review.author} · {review.rating}/5
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Información del local + CTA final unidos en un solo bloque, en
          vez de repetir un CTA centrado y aislado al final. */}
      <section className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Visítanos</h2>
            <p className="mt-3 text-foreground">{shopInfo.address}</p>
            <p className="mt-1 text-foreground">{shopInfo.phone}</p>
            <p className="text-foreground">{shopInfo.email}</p>
            <div className="mt-6">
              <ButtonLink to="/menu">Pide para recoger</ButtonLink>
            </div>
          </div>
          <div className="sm:border-l sm:border-border sm:pl-8">
            <p className="font-semibold">Horario</p>
            <ul className="mt-2 text-foreground">
              {shopInfo.hours.map((entry) => (
                <li key={entry.days}>
                  {entry.days}: {entry.time}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}