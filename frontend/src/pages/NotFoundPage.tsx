import { ButtonLink } from '../components/Button'

interface NotFoundPageProps {
  title?: string
  message?: string
}

export function NotFoundPage({
  title = 'Página no encontrada',
  message = 'Esta ruta no aparece en nuestro mapa. Puede que el enlace esté mal escrito o que la página ya no exista.',
}: NotFoundPageProps) {
  return (
    <section className="max-w-xl py-4">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/">Volver al inicio</ButtonLink>
        <ButtonLink to="/menu" variant="secondary">
          Ver la carta
        </ButtonLink>
      </div>
    </section>
  )
}
