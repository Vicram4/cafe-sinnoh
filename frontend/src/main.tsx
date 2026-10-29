import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { shouldRetryQuery } from './services/api/client'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import './index.css'

// Una única instancia para toda la app: React Query la usa para
// almacenar en caché las respuestas y evitar peticiones repetidas
// innecesarias (por ejemplo, entre la Home y la Carta, que piden el
// mismo listado de productos).
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: shouldRetryQuery } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)