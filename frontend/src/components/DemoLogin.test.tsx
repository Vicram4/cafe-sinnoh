import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../context/auth-context'
import { ApiError } from '../services/api/client'
import { DemoLogin } from './DemoLogin'

function renderDemoLogin(login: AuthContextValue['login']) {
  render(
    <AuthContext.Provider value={{ login } as AuthContextValue}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<DemoLogin />} />
          <Route path="/admin" element={<p>Panel de administración</p>} />
          <Route path="/account" element={<p>Mi cuenta</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('DemoLogin', () => {
  it('entra con la cuenta de admin de la demo y lleva al panel', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    renderDemoLogin(login)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar como admin' }))

    expect(login).toHaveBeenCalledWith('demo.admin@example.com', 'cafe-demo-admin')
    expect(await screen.findByText('Panel de administración')).toBeInTheDocument()
  })

  it('entra con la cuenta de cliente y lleva a su cuenta', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    renderDemoLogin(login)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar como cliente' }))

    expect(login).toHaveBeenCalledWith('demo.cliente@example.com', 'cafe-demo-cliente')
    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument()
  })

  it('muestra el error si el login falla y no navega', async () => {
    renderDemoLogin(vi.fn().mockRejectedValue(new ApiError('Email o contraseña incorrectos.', 401)))

    await userEvent.click(screen.getByRole('button', { name: 'Entrar como admin' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.')
    expect(screen.queryByText('Panel de administración')).toBeNull()
  })
})
