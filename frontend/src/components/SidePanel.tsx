import { useEffect, useRef, type ReactNode } from 'react'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// Panel lateral genérico y accesible. Se reutilizará para "Descubrir
// inspiración" ahora, y podría servir en el futuro para otros paneles
// (por ejemplo, el resumen del carrito).
export function SidePanel({ open, onClose, title, children }: SidePanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Cerrar con Escape, y bloquear el scroll de la página de fondo
  // mientras el panel está abierto (si no, se podría hacer scroll
  // "a través" del panel en móvil).
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-20 flex justify-end">
      {/* Overlay: clic fuera del panel para cerrar. aria-hidden porque
          es puramente visual, no debe anunciarse a un lector de pantalla. */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-sm flex-col bg-surface p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}