import { useState } from 'react'
import { useApplications, useUpdateApplicationStatus } from '../hooks/useAdminInbox'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ApiError } from '../services/api/client'
import type { ApplicationStatus, JobPosition } from '../types/inbox'

const statuses: ApplicationStatus[] = ['NEW', 'REVIEWED', 'CONTACTED', 'REJECTED']

const statusLabel: Record<ApplicationStatus, string> = {
  NEW: 'Nueva',
  REVIEWED: 'Revisada',
  CONTACTED: 'Contactada',
  REJECTED: 'Rechazada',
}

const statusTone: Record<ApplicationStatus, 'neutral' | 'accent' | 'success' | 'danger'> = {
  NEW: 'accent',
  REVIEWED: 'neutral',
  CONTACTED: 'success',
  REJECTED: 'danger',
}

const positionLabel: Record<JobPosition, string> = {
  BARISTA: 'Barista',
  WAITER: 'Camarero/a',
  KITCHEN: 'Cocina',
  STORE_MANAGER: 'Encargado/a de tienda',
  MARKETING: 'Marketing',
}

export function AdminApplicationsPage() {
  const { data: applications, isLoading, isError } = useApplications()
  const update = useUpdateApplicationStatus()
  // Se abre en "Nuevas": son las que requieren acción.
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('NEW')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando candidaturas…</p>
  if (isError || !applications) return <p className="text-ember">No se han podido cargar las candidaturas.</p>

  const visible = filter === 'ALL' ? applications : applications.filter((a) => a.status === filter)

  function handleChange(id: number, status: ApplicationStatus) {
    setError(null)
    update.mutate(
      { id, status },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.') },
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Candidaturas</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['NEW', 'REVIEWED', 'CONTACTED', 'REJECTED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={
              filter === status
                ? 'border-b-2 border-primary pb-1 text-sm font-semibold text-primary'
                : 'border-b-2 border-transparent pb-1 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {status === 'ALL' ? 'Todas' : statusLabel[status]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {visible.map((application) => (
          <li key={application.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {application.full_name} · {positionLabel[application.position]}
              </p>
              <Badge tone={statusTone[application.status]}>{statusLabel[application.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <a href={`mailto:${application.email}`} className="text-primary underline">
                {application.email}
              </a>{' '}
              · {application.phone} ·{' '}
              {new Date(application.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>

            <p className="mt-3 text-sm font-medium">Experiencia</p>
            <p className="whitespace-pre-wrap text-sm">{application.experience}</p>
            {application.cover_letter && (
              <>
                <p className="mt-3 text-sm font-medium">Carta de presentación</p>
                <p className="whitespace-pre-wrap text-sm">{application.cover_letter}</p>
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {statuses
                .filter((status) => status !== application.status)
                .map((status) => (
                  <Button
                    key={status}
                    variant={status === 'REJECTED' ? 'ghost' : 'secondary'}
                    disabled={update.isPending}
                    onClick={() => handleChange(application.id, status)}
                  >
                    Marcar como {statusLabel[status].toLowerCase()}
                  </Button>
                ))}
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className="mt-6 text-muted-foreground">No hay candidaturas con ese estado.</p>}
    </section>
  )
}