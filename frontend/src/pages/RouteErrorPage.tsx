import { useRouteError } from 'react-router'
import { Button } from '../components/Button'

// Se muestra dentro del layout (con cabecera y navegación) si una página
// falla al renderizar o no se puede descargar su código, por ejemplo sin
// conexión o tras publicar una versión nueva mientras se navegaba.
export function RouteErrorPage() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">No se ha podido cargar esta página</h1>
      <p className="mt-3 text-muted-foreground">
        Puede deberse a un problema de conexión o a que acabamos de publicar una versión nueva de la web.
        Recargar suele solucionarlo.
      </p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        Recargar
      </Button>
    </section>
  )
}
