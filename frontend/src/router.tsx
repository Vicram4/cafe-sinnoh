import { createBrowserRouter } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { HomePage } from './pages/HomePage'
import { RouteErrorPage } from './pages/RouteErrorPage'

// Code splitting por rutas: solo la Home y el layout van en el paquete
// inicial; el resto de páginas se descarga al visitarlas ("lazy"). Así un
// cliente nunca descarga el código del panel de administración.
// La seguridad real de /account y /admin sigue estando en el backend.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        // Ruta sin URL propia: hace que la carga inicial y los errores se
        // muestren dentro del layout, con la cabecera y la navegación.
        hydrateFallbackElement: <p className="text-muted-foreground">Cargando…</p>,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'menu', lazy: () => import('./pages/MenuPage').then((m) => ({ Component: m.MenuPage })) },
          // ":slug" es un parámetro: /menu/espresso-monte-corona
          {
            path: 'menu/:slug',
            lazy: () => import('./pages/ProductDetailPage').then((m) => ({ Component: m.ProductDetailPage })),
          },
          { path: 'cart', lazy: () => import('./pages/CartPage').then((m) => ({ Component: m.CartPage })) },
          { path: 'checkout', lazy: () => import('./pages/CheckoutPage').then((m) => ({ Component: m.CheckoutPage })) },
          { path: 'login', lazy: () => import('./pages/LoginPage').then((m) => ({ Component: m.LoginPage })) },
          { path: 'register', lazy: () => import('./pages/RegisterPage').then((m) => ({ Component: m.RegisterPage })) },
          {
            path: 'account',
            lazy: () => import('./layouts/AccountLayout').then((m) => ({ Component: m.AccountLayout })),
            children: [
              { index: true, lazy: () => import('./pages/AccountPage').then((m) => ({ Component: m.AccountPage })) },
              {
                path: 'orders',
                lazy: () => import('./pages/AccountOrdersPage').then((m) => ({ Component: m.AccountOrdersPage })),
              },
              {
                path: 'points',
                lazy: () => import('./pages/AccountPointsPage').then((m) => ({ Component: m.AccountPointsPage })),
              },
            ],
          },
          { path: 'about', element: <PlaceholderPage title="Nosotros" /> },
          { path: 'careers', lazy: () => import('./pages/CareersPage').then((m) => ({ Component: m.CareersPage })) },
          { path: 'contact', lazy: () => import('./pages/ContactPage').then((m) => ({ Component: m.ContactPage })) },
          {
            path: 'admin',
            lazy: () => import('./layouts/AdminLayout').then((m) => ({ Component: m.AdminLayout })),
            children: [
              {
                index: true,
                lazy: () => import('./pages/AdminDashboardPage').then((m) => ({ Component: m.AdminDashboardPage })),
              },
              {
                path: 'orders',
                lazy: () => import('./pages/AdminOrdersPage').then((m) => ({ Component: m.AdminOrdersPage })),
              },
              {
                path: 'products',
                lazy: () => import('./pages/AdminProductsPage').then((m) => ({ Component: m.AdminProductsPage })),
              },
              {
                path: 'products/new',
                lazy: () => import('./pages/AdminProductFormPage').then((m) => ({ Component: m.AdminProductFormPage })),
              },
              {
                path: 'products/:id/edit',
                lazy: () => import('./pages/AdminProductFormPage').then((m) => ({ Component: m.AdminProductFormPage })),
              },
              {
                path: 'reviews',
                lazy: () => import('./pages/AdminReviewsPage').then((m) => ({ Component: m.AdminReviewsPage })),
              },
              {
                path: 'applications',
                lazy: () =>
                  import('./pages/AdminApplicationsPage').then((m) => ({ Component: m.AdminApplicationsPage })),
              },
              {
                path: 'messages',
                lazy: () => import('./pages/AdminMessagesPage').then((m) => ({ Component: m.AdminMessagesPage })),
              },
              {
                path: 'users',
                lazy: () => import('./pages/AdminUsersPage').then((m) => ({ Component: m.AdminUsersPage })),
              },
            ],
          },
          // "*" recoge cualquier URL que no coincida con las anteriores (error 404).
          { path: '*', element: <PlaceholderPage title="Página no encontrada" /> },
        ],
      },
    ],
  },
])
