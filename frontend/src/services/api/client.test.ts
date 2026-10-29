import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'
import { submitJobApplication } from './careers'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(Response.json({ ok: true }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function lastRequest(): { url: string; init: RequestInit & { headers: Record<string, string> } } {
  const [url, init] = fetchMock.mock.lastCall!
  return { url, init }
}

describe('api client', () => {
  it('envía JSON con su Content-Type', async () => {
    await api.post('/orders', { notes: 'sin azúcar' })

    const { url, init } = lastRequest()
    expect(url).toMatch(/\/orders$/)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ notes: 'sin azúcar' }))
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('envía FormData tal cual y deja que el navegador ponga el Content-Type', async () => {
    const form = new FormData()
    form.append('full_name', 'Ana')

    await api.post('/careers/applications', form)

    const { init } = lastRequest()
    expect(init.body).toBe(form)
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  it('añade el token como cabecera Authorization', async () => {
    await api.get('/auth/me', { token: 'abc' })

    expect(lastRequest().init.headers.Authorization).toBe('Bearer abc')
  })

  it('convierte las respuestas de error en ApiError con el mensaje del backend', async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: 'No tienes permisos.' }, { status: 403 }))

    const error = await api.get('/admin/stats').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, message: 'No tienes permisos.' })
  })

  it('usa un mensaje genérico si el error no trae JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Internal Server Error', { status: 500 }))

    await expect(api.get('/products')).rejects.toMatchObject({
      status: 500,
      message: 'Ha ocurrido un error inesperado.',
    })
  })

  it('devuelve undefined en las respuestas 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(api.delete('/products/1')).resolves.toBeUndefined()
  })

  it('descarga archivos como Blob', async () => {
    fetchMock.mockResolvedValue(new Response('%PDF-', { headers: { 'Content-Type': 'application/pdf' } }))

    const blob = await api.getBlob('/careers/applications/1/cv', { token: 'abc' })

    expect(blob.type).toBe('application/pdf')
    expect(await blob.text()).toBe('%PDF-')
  })
})

describe('submitJobApplication', () => {
  it('construye el FormData con los campos rellenos y el CV', async () => {
    const cv = new File(['%PDF-'], 'cv.pdf', { type: 'application/pdf' })

    await submitJobApplication(
      {
        full_name: 'Ana',
        email: 'ana@example.com',
        phone: '600000000',
        position: 'BARISTA',
        experience: 'Dos años',
        cover_letter: null,
      },
      cv,
    )

    const form = lastRequest().init.body as FormData
    expect(form.get('full_name')).toBe('Ana')
    expect(form.get('position')).toBe('BARISTA')
    expect(form.has('cover_letter')).toBe(false)
    expect((form.get('cv') as File).name).toBe('cv.pdf')
  })

  it('no incluye el campo cv si no hay archivo', async () => {
    await submitJobApplication({
      full_name: 'Ana',
      email: 'ana@example.com',
      phone: '600000000',
      position: 'BARISTA',
      experience: 'Dos años',
    })

    expect((lastRequest().init.body as FormData).has('cv')).toBe(false)
  })
})
