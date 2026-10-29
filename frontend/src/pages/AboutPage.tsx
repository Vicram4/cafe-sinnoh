import { MountainLine } from '../components/MountainLine'
import { usePageTitle } from '../hooks/usePageTitle'

// Columna estrecha de lectura, como las secciones de texto de la Home. Sin
// elemento llamativo propio: el único de la web es el hero de la portada.
export function AboutPage() {
  usePageTitle('Nosotros')
  return (
    <article className="max-w-xl py-4">
      <h1 className="text-3xl font-semibold">Nosotros</h1>
      <p className="mt-4 text-lg text-foreground">
        Café Sinnoh es una cafetería pequeña con alma de cuaderno de viaje: café de especialidad,
        dulces caseros y bebidas de temporada en un local pensado para quedarse un rato, sin prisas.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Nuestro café</h2>
        <p className="mt-3 text-foreground">
          Preferimos una carta corta y bien hecha a una larga. Los cafés cambian con la temporada y
          cada bebida tiene un motivo para estar ahí; si preguntas, el equipo te cuenta de dónde
          viene lo que tienes en la taza.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Una carta con mapa</h2>
        <p className="mt-3 text-foreground">
          La carta se recorre como una ruta. Algunos productos llevan el nombre de lugares de una
          región fría y montañosa: cumbres, bosques y lagos que inspiran su sabor. Otros rinden
          homenaje a criaturas que nos acompañan desde la infancia; en su ficha encontrarás su
          historia y un aviso legal, porque no nos pertenecen.
        </p>
      </section>

      <MountainLine className="mt-12 h-8 w-full text-bark" />

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Sobre este proyecto</h2>
        <p className="mt-3 text-foreground">
          Café Sinnoh no existe: es un proyecto personal de portfolio, sin ánimo de lucro, que
          muestra el desarrollo completo de una aplicación web, desde la base de datos hasta la
          interfaz. Los pedidos no se preparan ni se cobran.
        </p>
        <p className="mt-3 text-foreground">
          Está hecho con React, TypeScript y FastAPI sobre PostgreSQL, con tests automáticos,
          Docker e integración continua.{' '}
          <a
            href="https://github.com/Vicram4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Ver el perfil del desarrollador en GitHub
          </a>
          .
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Pokémon y los nombres relacionados son marcas de Nintendo, Game Freak y The Pokémon
          Company. Este proyecto de fans no está afiliado a ellas ni usa recursos oficiales.
        </p>
      </section>
    </article>
  )
}
