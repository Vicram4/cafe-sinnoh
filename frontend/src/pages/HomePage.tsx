import { Link } from 'react-router'
import { products } from '../data/products'
import { categories } from '../data/categories'
import { exampleReviews } from '../data/reviews'
import { shopInfo } from '../data/shop'
import { ProductCard } from '../components/ProductCard'
import { ButtonLink } from '../components/Button'
import { Card } from '../components/Card'

export function HomePage() {
  const featuredProducts = products.filter((product) => product.isFeatured)

  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="rounded-3xl bg-surface p-8 text-center sm:p-16">
        <h1 className="text-3xl font-bold sm:text-4xl">Café Sinnoh</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Café de especialidad, dulces caseros y un local pensado para quedarse. Cada rincón de
          nuestra carta esconde una pequeña historia por descubrir.
        </p>
                <ButtonLink to="/menu" className="mt-6">Ver la carta</ButtonLink>
      </section>

      {/* Presentación breve */}
      <section className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold">Un café con algo más</h2>
        <p className="mt-3 text-muted-foreground">
          Café Sinnoh nació como un pequeño homenaje a los viajes: a los que se hacen explorando
          nuevas rutas y a los que se hacen con una taza en la mano. Detrás de algunos nombres de
          nuestra carta hay una historia curiosa. Solo hay que fijarse un poco.
        </p>
      </section>

      {/* Categorías */}
      <section>
        <h2 className="text-2xl font-bold">Categorías</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to="/menu"
              className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">Destacados</h2>
          <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground">
            Ver toda la carta →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className="rounded-3xl bg-muted p-8">
        <h2 className="text-2xl font-bold">Nuestra historia</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Todo empezó con la idea de unir dos pasiones: el café y la exploración. Nuestro local
          está lleno de guiños a rutas, lagos y rincones que solo los más curiosos llegan a
          reconocer del todo. No hace falta conocerlos para disfrutar de la carta, pero quien se
          fija, encuentra algo más.
        </p>
      </section>

      {/* Puntos */}
      <section className="text-center">
        <h2 className="text-2xl font-bold">Programa de puntos</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Acumula puntos con cada pedido y canjéalos por recompensas. Solo tienes que crear una
          cuenta gratuita.
        </p>
                <ButtonLink to="/register" variant="secondary" className="mt-4">Crear cuenta</ButtonLink>
      </section>

      {/* Reseñas */}
      <section>
        <h2 className="text-2xl font-bold">Lo que dicen de nosotros</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {exampleReviews.map((review) => (
            <Card key={review.id}>
              <p aria-hidden="true" className="text-accent">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </p>
              <p className="sr-only">{review.rating} de 5 estrellas</p>
              <p className="mt-2 text-sm text-muted-foreground">"{review.comment}"</p>
              <p className="mt-3 text-sm font-semibold">{review.author}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Información del local */}
      <section className="rounded-3xl bg-surface p-8">
        <h2 className="text-2xl font-bold">Visítanos</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="font-semibold">Dirección</p>
            <p className="text-muted-foreground">{shopInfo.address}</p>
            <p className="mt-3 font-semibold">Contacto</p>
            <p className="text-muted-foreground">{shopInfo.phone}</p>
            <p className="text-muted-foreground">{shopInfo.email}</p>
          </div>
          <div>
            <p className="font-semibold">Horario</p>
            <ul className="text-muted-foreground">
              {shopInfo.hours.map((entry) => (
                <li key={entry.days}>
                  {entry.days}: {entry.time}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center">
                <ButtonLink to="/menu">Pide para recoger</ButtonLink>
      </section>
    </div>
  )
}