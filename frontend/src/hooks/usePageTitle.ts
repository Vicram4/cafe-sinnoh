import { useEffect } from 'react'

const SITE_NAME = 'Café Sinnoh'

// Título de la pestaña por página ("Carta · Café Sinnoh"): ayuda en
// pestañas, historial, marcadores y lectores de pantalla. Con document.title
// y no con <title> de React 19, porque index.html ya trae un <title>
// estático (para quien no ejecuta JS) y el navegador usaría el primero.
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])
}
