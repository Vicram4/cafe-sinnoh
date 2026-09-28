import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'

interface PlaceholderPageProps {
  title: string
}

// Página provisional: se usa mientras construimos cada sección real.
// Cuando una página tenga contenido, se crea su propio archivo en /pages
// y se sustituye en router.tsx. Este componente desaparecerá al final.
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Página en construcción.</p>

      {/* Bloque temporal para comprobar visualmente Button, Card y Badge.
          Se elimina en cuanto empiece la FASE 4. */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost">Ghost</Button>
        <Badge tone="accent">Destacado</Badge>
        <Badge tone="success">Disponible</Badge>
        <Badge tone="danger">Agotado</Badge>
      </div>

      <Card className="mt-4 max-w-sm">
        <p className="font-semibold">Espresso Monte Corona</p>
        <p className="text-sm text-muted-foreground">Pasa el ratón por encima de esta tarjeta.</p>
      </Card>
    </section>
  )
}