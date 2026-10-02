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
import { AccountLayout } from './layouts/AccountLayout'
import { AccountPage } from './pages/AccountPage'
import { AccountOrdersPage } from './pages/AccountOrdersPage'
import { AccountPointsPage } from './pages/AccountPointsPage'
import { CareersPage } from './pages/CareersPage'
import { ContactPage } from './pages/ContactPage'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminOrdersPage } from './pages/AdminOrdersPage'
import { AdminProductsPage } from './pages/AdminProductsPage'
import { AdminProductFormPage } from './pages/AdminProductFormPage'

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
      {
        path: 'account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountPage /> },
          { path: 'orders', element: <AccountOrdersPage /> },
          { path: 'points', element: <AccountPointsPage /> },
        ],
      },
      { path: 'about', element: <PlaceholderPage title="Nosotros" /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'contact', element: <ContactPage /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AdminProductFormPage /> },
          { path: 'products/:id/edit', element: <AdminProductFormPage /> },
        ],
      },
      // "*" recoge cualquier URL que no coincida con las anteriores (error 404).
      { path: '*', element: <PlaceholderPage title="Página no encontrada" /> },
    ],
  },
])