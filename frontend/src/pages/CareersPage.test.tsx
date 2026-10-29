import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CareersPage } from './CareersPage'
import { submitJobApplication } from '../services/api/careers'

vi.mock('../services/api/careers', () => ({ submitJobApplication: vi.fn() }))

const submitMock = vi.mocked(submitJobApplication)

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CareersPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
  // applyAccept: false para poder elegir un archivo que no es PDF, como
  // haría alguien que cambia el filtro del selector a "Todos los archivos".
  return userEvent.setup({ applyAccept: false })
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Prueba')
  await user.type(screen.getByLabelText('Email'), 'ana@example.com')
  await user.type(screen.getByLabelText('Teléfono'), '600111222')
  await user.selectOptions(screen.getByLabelText('Puesto'), 'BARISTA')
  await user.type(screen.getByLabelText('Experiencia'), 'Dos años en cafetería')
}

function pdf(name = 'cv.pdf', size?: number) {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  submitMock.mockReset()
  submitMock.mockResolvedValue({})
})

describe('CareersPage', () => {
  it('ofrece adjuntar el CV como recomendación, solo en PDF', () => {
    renderPage()

    const input = screen.getByLabelText('CV')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', '.pdf,application/pdf')
    expect(input).toHaveAccessibleDescription('Recomendado: adjunta tu CV en PDF, máx. 5 MB.')
  })

  it('el campo trampa anti-bots no es accesible para las personas', () => {
    renderPage()

    const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]')!
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByRole('textbox', { name: /no rellenes/i })).toBeNull()
  })

  it('envía la candidatura con el CV adjunto', async () => {
    const user = renderPage()
    await fillRequiredFields(user)
    const cv = pdf('Currículum.pdf')
    await user.upload(screen.getByLabelText('CV'), cv)

    await user.click(screen.getByRole('button', { name: 'Enviar candidatura' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Gracias por tu candidatura')
    expect(submitMock).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Ana Prueba', position: 'BARISTA', cover_letter: null }),
      cv,
    )
  })

  it('permite enviar sin CV', async () => {
    const user = renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Enviar candidatura' }))

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(submitMock).toHaveBeenCalledWith(expect.any(Object), undefined)
  })

  it('avisa antes de enviar si el archivo no es PDF', async () => {
    const user = renderPage()
    await fillRequiredFields(user)
    await user.upload(screen.getByLabelText('CV'), new File(['hola'], 'foto.png', { type: 'image/png' }))

    await user.click(screen.getByRole('button', { name: 'Enviar candidatura' }))

    expect(await screen.findByText('El CV debe ser un archivo PDF.')).toBeInTheDocument()
    expect(submitMock).not.toHaveBeenCalled()
  })

  it('avisa antes de enviar si el PDF supera 5 MB', async () => {
    const user = renderPage()
    await fillRequiredFields(user)
    await user.upload(screen.getByLabelText('CV'), pdf('grande.pdf', 5 * 1024 * 1024 + 1))

    await user.click(screen.getByRole('button', { name: 'Enviar candidatura' }))

    expect(await screen.findByText('El CV no puede superar los 5 MB.')).toBeInTheDocument()
    expect(submitMock).not.toHaveBeenCalled()
  })

  it('muestra el error que devuelve el backend', async () => {
    const { ApiError } = await import('../services/api/client')
    submitMock.mockRejectedValue(new ApiError('El CV debe ser un archivo PDF.', 415))
    const user = renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Enviar candidatura' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El CV debe ser un archivo PDF.')
  })
})
