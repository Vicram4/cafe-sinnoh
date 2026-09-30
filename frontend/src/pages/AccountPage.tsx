import { useAuth } from '../hooks/useAuth'

export function AccountPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section className="max-w-md">
      <h1 className="text-2xl font-semibold">Mis datos</h1>
      <dl className="mt-6 divide-y divide-border border-t border-border text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">Nombre</dt>
          <dd>{user.full_name}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd>{user.phone ?? 'No indicado'}</dd>
        </div>
      </dl>
    </section>
  )
}