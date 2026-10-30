import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from '../utils/zod'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../services/api/client'
import { Button } from '../components/Button'
import { HoneypotField } from '../components/HoneypotField'
import { FormPrivacyNote } from '../components/FormPrivacyNote'
import { usePageTitle } from '../hooks/usePageTitle'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Introduce tu nombre completo.').max(255, 'El nombre es demasiado largo.'),
  email: z.string().email('Introduce un email válido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128, 'La contraseña no puede superar los 128 caracteres.'),
  website: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  usePageTitle('Crear cuenta')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setServerError(null)
    try {
      await registerUser({ email: data.email, password: data.password, full_name: data.fullName, website: data.website })
      navigate('/')
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo conectar con el servidor.')
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <HoneypotField registration={register('website')} />
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="w-full border border-border bg-surface px-3 py-2 text-sm"
            {...register('fullName')}
          />
          {errors.fullName && <p className="mt-1 text-sm text-ember">{errors.fullName.message}</p>}
        </div>

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
            autoComplete="new-password"
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
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
        <FormPrivacyNote />
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary underline underline-offset-4">
          Entra
        </Link>
      </p>
    </section>
  )
}