import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { z } from 'zod'
import { router } from './router'
import { shouldRetryQuery } from './services/api/client'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
// Fuentes servidas desde la propia web (no desde Google Fonts): el navegador
// del visitante no envía su IP a Google y la futura CSP no necesita excepciones.
// Fraunces con los ejes de peso y tamaño óptico, como se pedía a Google.
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/work-sans'
import './index.css'

// Sin esto, zod prueba si puede usar new Function para validar más rápido, y
// la CSP (vercel.json) lo registra como violación aunque zod capture el error.
z.config({ jitless: true })

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