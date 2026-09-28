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
      <p className="mt-2 text-slate-600">Página en construcción.</p>
    </section>
  )
}