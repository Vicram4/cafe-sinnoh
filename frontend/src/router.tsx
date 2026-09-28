import { createBrowserRouter } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'

// Mapa de rutas de la aplicación. Todas cuelgan del layout público, que
// aporta la cabecera común. Más adelante /account y /admin tendrán su propio
// layout y protección de acceso (la seguridad real siempre estará en el backend).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Inicio" /> },
      { path: 'menu', element: <PlaceholderPage title="Carta" /> },
      // ":slug" es un parámetro: /menu/espresso-monte-corona
      { path: 'menu/:slug', element: <PlaceholderPage title="Detalle de producto" /> },
      { path: 'cart', element: <PlaceholderPage title="Carrito" /> },
      { path: 'checkout', element: <PlaceholderPage title="Finalizar pedido" /> },
      { path: 'login', element: <PlaceholderPage title="Iniciar sesión" /> },
      { path: 'register', element: <PlaceholderPage title="Crear cuenta" /> },
      { path: 'account', element: <PlaceholderPage title="Mi cuenta" /> },
      { path: 'account/orders', element: <PlaceholderPage title="Mis pedidos" /> },
      { path: 'account/points', element: <PlaceholderPage title="Mis puntos" /> },
      { path: 'about', element: <PlaceholderPage title="Nosotros" /> },
      { path: 'careers', element: <PlaceholderPage title="Trabaja con nosotros" /> },
      { path: 'contact', element: <PlaceholderPage title="Contacto" /> },
      { path: 'admin', element: <PlaceholderPage title="Administración" /> },
      // "*" recoge cualquier URL que no coincida con las anteriores (error 404).
      { path: '*', element: <PlaceholderPage title="Página no encontrada" /> },
    ],
  },
])