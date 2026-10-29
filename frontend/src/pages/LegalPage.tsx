import { usePageTitle } from '../hooks/usePageTitle'

// Aviso legal y privacidad de un proyecto personal de portfolio, sin ánimo
// de lucro: proporcionado a eso, no a un negocio real. El email de contacto
// es el del autor para este fin, nunca uno personal.
const CONTACT_EMAIL = 'victorramos.devs@gmail.com'

export function LegalPage() {
  usePageTitle('Aviso legal y privacidad')
  return (
    <article className="max-w-2xl py-4">
      <h1 className="text-3xl font-semibold">Aviso legal y privacidad</h1>
      <p className="mt-3 text-muted-foreground">Resumen claro de qué es esta web y qué hace con tus datos.</p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Qué es esta web</h2>
        <p className="mt-3 text-foreground">
          Café Sinnoh es una cafetería ficticia. Esta web es un proyecto personal de portfolio, sin ánimo
          de lucro, que demuestra el desarrollo de una aplicación web completa. No es un negocio: los
          pedidos no se preparan ni se cobran, las candidaturas de empleo no corresponden a ofertas
          reales y los datos del local (dirección, teléfono y correo) son inventados.
        </p>
        <p className="mt-3 text-foreground">
          Es un proyecto de fans no afiliado a Nintendo, Game Freak ni The Pokémon Company. Pokémon y los
          nombres relacionados son marcas de sus respectivos propietarios. La web no usa imágenes ni
          recursos oficiales.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Por favor, no uses datos reales</h2>
        <p className="mt-3 text-foreground">
          Al ser una demostración, te pedimos que no introduzcas datos personales reales ni adjuntes tu
          CV de verdad. Puedes probarlo todo con las cuentas de demostración o con datos inventados.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Qué datos se guardan</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
          <li>
            <strong>Si creas una cuenta:</strong> tu nombre, tu email y, si lo indicas, un teléfono. La
            contraseña nunca se guarda tal cual, solo una huella cifrada (Argon2).
          </li>
          <li>
            <strong>Lo que hagas con ella:</strong> pedidos de prueba, puntos, canjes y reseñas.
          </li>
          <li>
            <strong>Formularios de contacto y empleo:</strong> lo que escribas en ellos y, en empleo, el
            PDF que adjuntes.
          </li>
          <li>
            <strong>Seguridad:</strong> para frenar ataques, se registran durante un tiempo limitado los
            intentos de inicio de sesión fallidos (con tu IP y una huella cifrada del email, nunca el
            email en sí) y los envíos de formularios por IP. Estos registros se borran solos a los 15 y
            60 minutos.
          </li>
        </ul>
        <p className="mt-3 text-foreground">
          Los datos solo se usan para que la demostración funcione. No se venden, no se ceden a nadie ni
          se usan para publicidad.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Cuánto tiempo se guardan</h2>
        <p className="mt-3 text-foreground">
          En la versión pública de la demo, todos los datos (cuentas, pedidos, mensajes, candidaturas y
          CVs) se borran automáticamente cada día, cuando la demo se reinicia a su estado inicial.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Cookies y almacenamiento del navegador</h2>
        <p className="mt-3 text-foreground">
          Esta web no usa cookies de publicidad ni de analítica, ni carga servicios de terceros: incluso
          las tipografías se sirven desde la propia web. Solo guarda en tu navegador lo imprescindible
          para funcionar:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
          <li>
            Una cookie técnica para mantener la sesión iniciada al recargar la página. Solo existe si
            inicias sesión, dura como máximo 7 días y se borra al salir.
          </li>
          <li>El contenido de tu carrito y tu preferencia de modo claro u oscuro.</li>
          <li>Una marca que indica si tenías la sesión iniciada, para recuperarla al volver.</li>
        </ul>
        <p className="mt-3 text-foreground">
          Al ser estrictamente necesarios para funcionar, no requieren tu consentimiento. Puedes borrarlos
          cuando quieras desde la configuración de tu navegador.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Tus derechos y contacto</h2>
        <p className="mt-3 text-foreground">
          Puedes pedir que se consulten, corrijan o borren tus datos escribiendo a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          . Si crees que no se han respetado tus derechos, también puedes reclamar ante la Agencia
          Española de Protección de Datos (aepd.es).
        </p>
      </section>
    </article>
  )
}
