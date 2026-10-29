import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { demoAccounts } from '../data/demo'
import { ApiError } from '../services/api/client'
import { Button } from './Button'

// Acceso en un clic para quien solo quiere probar la web (p. ej. un
// reclutador): nadie se registra para ver una demo.
export function DemoLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enterAs(account: (typeof demoAccounts)[number]) {
    setError(null)
    setPending(account.email)
    try {
      await login(account.email, account.password)
      navigate(account.redirectTo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.')
    } finally {
      setPending(null)
    }
  }

  return (
    <section aria-labelledby="demo-login-title" className="mt-10 border-t border-border pt-6">
      <h2 id="demo-login-title" className="text-lg font-semibold">
        ¿Solo quieres probarla?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Entra con una cuenta de demostración. Sus datos se reinician cada día.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {demoAccounts.map((account) => (
          <Button
            key={account.email}
            variant="secondary"
            disabled={pending !== null}
            onClick={() => enterAs(account)}
          >
            {pending === account.email ? 'Entrando…' : account.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}
    </section>
  )
}
