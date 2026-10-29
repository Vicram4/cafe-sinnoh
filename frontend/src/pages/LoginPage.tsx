import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api/client'
import { Button } from '../components/Button'
import { DemoLogin } from '../components/DemoLogin'
import { isDemoMode } from '../data/demo'

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido.'),
  password: z.string().min(1, 'Introduce tu contraseña.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (error) {
      // 401 (credenciales incorrectas) es el caso esperado; cualquier
      // otro fallo (red caída, servidor apagado) se muestra igual,
      // sin distinguir el mensaje técnico exacto al usuario.
      setServerError(error instanceof ApiError ? error.message : 'No se pudo conectar con el servidor.')
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-ember">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-ember">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p role="alert" className="border border-ember px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary underline underline-offset-4">
          Crea una
        </Link>
      </p>

      {isDemoMode && <DemoLogin />}
    </section>
  )
}