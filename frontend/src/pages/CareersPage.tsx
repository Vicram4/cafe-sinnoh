import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { jobPositions } from '../data/positions'
import { submitJobApplication } from '../services/api/careers'
import { ApiError } from '../services/api/client'
import { Button } from '../components/Button'

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Introduce tu nombre completo.'),
  email: z.string().email('Introduce un email válido.'),
  phone: z.string().min(6, 'Introduce un teléfono válido.'),
  position: z.enum(['BARISTA', 'WAITER', 'KITCHEN', 'STORE_MANAGER', 'MARKETING'], {
    message: 'Elige un puesto.',
  }),
  experience: z.string().min(1, 'Cuéntanos tu experiencia.').max(2000),
  coverLetter: z.string().max(2000).optional(),
})

type ApplicationForm = z.infer<typeof applicationSchema>

export function CareersPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationForm>({ resolver: zodResolver(applicationSchema) })

  const mutation = useMutation({
    mutationFn: (data: ApplicationForm) =>
      submitJobApplication({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        experience: data.experience,
        cover_letter: data.coverLetter || null,
      }),
    onSuccess: () => {
      setSuccess(true)
      setServerError(null)
      reset()
    },
    onError: (error) => {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo enviar la candidatura.')
    },
  })

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Trabaja con nosotros</h1>
      <p className="mt-3 text-muted-foreground">
        Buscamos personas con ganas de formar parte de Café Sinnoh. Estos son los puestos que
        solemos cubrir; cuéntanos en qué encajas mejor.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {jobPositions.map((position) => (
          <li key={position.value} className="border border-border px-3 py-1 text-sm text-muted-foreground">
            {position.label}
          </li>
        ))}
      </ul>

      {success ? (
        <p role="status" className="mt-8 border border-primary px-4 py-3 text-primary">
          Gracias por tu candidatura. La revisaremos y nos pondremos en contacto contigo.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mt-8 flex flex-col gap-4"
          noValidate
        >
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="fullName"
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
              className="w-full border border-border bg-surface px-3 py-2 text-sm"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-ember">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full border border-border bg-surface px-3 py-2 text-sm"
              {...register('phone')}
            />
            {errors.phone && <p className="mt-1 text-sm text-ember">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="position" className="mb-1 block text-sm font-medium">
              Puesto
            </label>
            <select
              id="position"
              defaultValue=""
              className="w-full border border-border bg-surface px-3 py-2 text-sm"
              {...register('position')}
            >
              <option value="" disabled>
                Elige un puesto
              </option>
              {jobPositions.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
            {errors.position && <p className="mt-1 text-sm text-ember">{errors.position.message}</p>}
          </div>

          <div>
            <label htmlFor="experience" className="mb-1 block text-sm font-medium">
              Experiencia
            </label>
            <textarea
              id="experience"
              rows={4}
              className="w-full border border-border bg-surface px-3 py-2 text-sm"
              {...register('experience')}
            />
            {errors.experience && <p className="mt-1 text-sm text-ember">{errors.experience.message}</p>}
          </div>

          <div>
            <label htmlFor="coverLetter" className="mb-1 block text-sm font-medium">
              Carta de presentación (opcional)
            </label>
            <textarea
              id="coverLetter"
              rows={3}
              className="w-full border border-border bg-surface px-3 py-2 text-sm"
              {...register('coverLetter')}
            />
          </div>

          {serverError && (
            <p role="alert" className="border border-ember px-3 py-2 text-sm text-ember">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting || mutation.isPending} className="mt-2 self-start">
            {mutation.isPending ? 'Enviando…' : 'Enviar candidatura'}
          </Button>
        </form>
      )}
    </section>
  )
}