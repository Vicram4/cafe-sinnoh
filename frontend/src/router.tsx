import { createBrowserRouter } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { MenuPage } from './pages/MenuPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'

// Mapa de rutas de la aplicación. Todas cuelgan del layout público, que
// aporta la cabecera común. Más adelante /account y /admin tendrán su propio
// layout y protección de acceso (la seguridad real siempre estará en el backend).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
            { index: true, element: <HomePage /> },
            { path: 'menu', element: <MenuPage /> },
      // ":slug" es un parámetro: /menu/espresso-monte-corona
            { path: 'menu/:slug', element: <ProductDetailPage /> },
            { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
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