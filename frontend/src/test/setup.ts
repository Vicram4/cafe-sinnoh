import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals` de Vitest, Testing Library no puede desmontar los
// componentes por sí sola entre tests: se hace aquí explícitamente.
afterEach(() => {
  cleanup()
})
