import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAdminUsers, useUpdateAdminUser } from '../hooks/useAdminUsers'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ApiError } from '../services/api/client'
import type { AdminUser } from '../types/user'
import { usePageTitle } from '../hooks/usePageTitle'

export function AdminUsersPage() {
  usePageTitle('Admin · Usuarios')
  const { user: me } = useAuth()
  const { data: users, isLoading, isError } = useAdminUsers()
  const update = useUpdateAdminUser()
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando usuarios…</p>
  if (isError || !users) return <p className="text-ember">No se han podido cargar los usuarios.</p>

  function run(user: AdminUser, data: { role?: 'USER' | 'ADMIN'; is_active?: boolean }, question: string) {
    if (!window.confirm(question)) return
    setError(null)
    update.mutate(
      { id: user.id, data },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.') },
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Usuarios</h1>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {users.map((user) => {
          const isMe = user.id === me?.id
          return (
            <li key={user.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {user.full_name}
                  {isMe && <span className="text-muted-foreground"> (tú)</span>}
                </p>
                <div className="flex gap-2">
                  <Badge tone={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                  </Badge>
                  <Badge tone={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Activo' : 'Desactivado'}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.email} · alta el{' '}
                {new Date(user.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>

              {/* Sin botones sobre uno mismo: el backend lo rechazaría igualmente. */}
              {!isMe && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={update.isPending}
                    onClick={() =>
                      run(
                        user,
                        { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' },
                        user.role === 'ADMIN'
                          ? `¿Quitar el rol de administrador a ${user.full_name}?`
                          : `¿Dar rol de administrador a ${user.full_name}?`,
                      )
                    }
                  >
                    {user.role === 'ADMIN' ? 'Quitar administrador' : 'Hacer administrador'}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={update.isPending}
                    onClick={() =>
                      run(
                        user,
                        { is_active: !user.is_active },
                        user.is_active
                          ? `¿Desactivar la cuenta de ${user.full_name}? No podrá iniciar sesión.`
                          : `¿Reactivar la cuenta de ${user.full_name}?`,
                      )
                    }
                  >
                    {user.is_active ? 'Desactivar' : 'Reactivar'}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}