import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { shopInfo } from '../data/shop'
import { submitContactMessage } from '../services/api/contact'
import { ApiError } from '../services/api/client'
import { Button } from '../components/Button'
import { HoneypotField } from '../components/HoneypotField'
import { FormPrivacyNote } from '../components/FormPrivacyNote'
import { usePageTitle } from '../hooks/usePageTitle'

const contactSchema = z.object({
  name: z.string().min(2, 'Introduce tu nombre.'),
  email: z.string().email('Introduce un email válido.'),
  message: z.string().min(1, 'Escribe tu mensaje.').max(2000),
  website: z.string().optional(),
})

type ContactForm = z.infer<typeof contactSchema>

export function ContactPage() {
  usePageTitle('Contacto')
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  const mutation = useMutation({
    mutationFn: submitContactMessage,
    onSuccess: () => {
      setSuccess(true)
      setServerError(null)
      reset()
    },
    onError: (error) => {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo enviar el mensaje.')
    },
  })

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-semibold">Contacto</h1>
        <div className="mt-4 text-sm text-foreground">
          <p>{shopInfo.address}</p>
          <p className="mt-1">{shopInfo.phone}</p>
          <p>{shopInfo.email}</p>
        </div>
        <div className="mt-4">
          <p className="font-semibold">Horario</p>
          <ul className="mt-1 text-sm text-muted-foreground">
            {shopInfo.hours.map((entry) => (
              <li key={entry.days}>
                {entry.days}: {entry.time}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        {success ? (
          <p role="status" className="border border-primary px-4 py-3 text-primary">
            Gracias por tu mensaje. Te responderemos lo antes posible.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="flex flex-col gap-4"
            noValidate
          >
            <HoneypotField registration={register('website')} />
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Nombre
              </label>
              <input
                id="name"
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-sm text-ember">{errors.name.message}</p>}
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
              <label htmlFor="message" className="mb-1 block text-sm font-medium">
                Mensaje
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
                {...register('message')}
              />
              {errors.message && <p className="mt-1 text-sm text-ember">{errors.message.message}</p>}
            </div>

            {serverError && (
              <p role="alert" className="border border-ember px-3 py-2 text-sm text-ember">
                {serverError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || mutation.isPending} className="self-start">
              {mutation.isPending ? 'Enviando…' : 'Enviar mensaje'}
            </Button>
            <FormPrivacyNote />
          </form>
        )}
      </div>
    </section>
  )
}