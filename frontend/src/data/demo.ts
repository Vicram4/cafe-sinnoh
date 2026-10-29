// Modo demo: se activa al compilar con VITE_DEMO_MODE=true (la demo
// publicada). Muestra el aviso de demo y los botones de cuentas de prueba.
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// Públicas a propósito: deben coincidir con backend/app/seed/seed_demo.py.
// Las cuentas y sus datos se reinician cada día en la demo publicada.
export const demoAccounts = [
  { label: 'Entrar como cliente', email: 'demo.cliente@example.com', password: 'cafe-demo-cliente', redirectTo: '/account' },
  { label: 'Entrar como admin', email: 'demo.admin@example.com', password: 'cafe-demo-admin', redirectTo: '/admin' },
] as const
