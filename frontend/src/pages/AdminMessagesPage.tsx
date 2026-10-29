import { useState } from 'react'
import { useContactMessages, useSetMessageRead } from '../hooks/useAdminInbox'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ApiError } from '../services/api/client'
import { usePageTitle } from '../hooks/usePageTitle'

type Filter = 'UNREAD' | 'READ' | 'ALL'

const filterLabel: Record<Filter, string> = {
  UNREAD: 'Sin leer',
  READ: 'Leídos',
  ALL: 'Todos',
}

export function AdminMessagesPage() {
  usePageTitle('Admin · Mensajes')
  const { data: messages, isLoading, isError } = useContactMessages()
  const setRead = useSetMessageRead()
  const [filter, setFilter] = useState<Filter>('UNREAD')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-muted-foreground">Cargando mensajes…</p>
  if (isError || !messages) return <p className="text-ember">No se han podido cargar los mensajes.</p>

  const visible = messages.filter((message) => {
    if (filter === 'UNREAD') return !message.is_read
    if (filter === 'READ') return message.is_read
    return true
  })

  function handleToggle(id: number, isRead: boolean) {
    setError(null)
    setRead.mutate(
      { id, isRead },
      { onError: (err) => setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.') },
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Mensajes de contacto</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['UNREAD', 'READ', 'ALL'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={
              filter === value
                ? 'border-b-2 border-primary pb-1 text-sm font-semibold text-primary'
                : 'border-b-2 border-transparent pb-1 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {filterLabel[value]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ember px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {visible.map((message) => (
          <li key={message.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{message.name}</p>
              <Badge tone={message.is_read ? 'neutral' : 'accent'}>
                {message.is_read ? 'Leído' : 'Sin leer'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <a href={`mailto:${message.email}`} className="text-primary underline">
                {message.email}
              </a>{' '}
              ·{' '}
              {new Date(message.created_at).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.message}</p>

            <div className="mt-3">
              <Button
                variant="secondary"
                disabled={setRead.isPending}
                onClick={() => handleToggle(message.id, !message.is_read)}
              >
                {message.is_read ? 'Marcar como sin leer' : 'Marcar como leído'}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className="mt-6 text-muted-foreground">No hay mensajes en esta vista.</p>}
    </section>
  )
}