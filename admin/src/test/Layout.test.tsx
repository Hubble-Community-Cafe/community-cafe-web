import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useRole } from '../lib/RoleContext'
import type { AdminRole } from '../lib/api'

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ instance: { logoutRedirect: vi.fn() } }),
}))
vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))

const mockUseRole = vi.mocked(useRole)

function renderLayoutAs(role: AdminRole) {
  mockUseRole.mockReturnValue({
    user: { id: 1, email: 'staff@hubble.cafe', displayName: 'Staff', role },
    role,
    isLoading: false,
    error: null,
    refetch: () => {},
  })
  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
  )
}

describe('Layout role-gated navigation', () => {
  it('shows content modules but not the admin area to a viewer', () => {
    renderLayoutAs('VIEWER')
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument()
    expect(within(nav).getByText('Menu')).toBeInTheDocument()
    expect(within(nav).getByText('Daily dish')).toBeInTheDocument()
    expect(within(nav).queryByText('Users')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Audit log')).not.toBeInTheDocument()
  })

  it('shows content modules to a DDD poster but not the admin area', () => {
    renderLayoutAs('DDD_POSTER')
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Daily dish')).toBeInTheDocument()
    expect(within(nav).getByText('Menu')).toBeInTheDocument()
    expect(within(nav).queryByText('Users')).not.toBeInTheDocument()
  })

  it('shows content modules to an editor but not the admin area', () => {
    renderLayoutAs('EDITOR')
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Menu')).toBeInTheDocument()
    expect(within(nav).getByText('Events')).toBeInTheDocument()
    expect(within(nav).queryByText('Users')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Audit log')).not.toBeInTheDocument()
  })

  it('shows the admin area to an admin', () => {
    renderLayoutAs('ADMIN')
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Users')).toBeInTheDocument()
    expect(within(nav).getByText('Audit log')).toBeInTheDocument()
  })
})

describe('Layout footer', () => {
  it('renders the role as a badge', () => {
    renderLayoutAs('ADMIN')
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('formats a multi-word role for the badge', () => {
    renderLayoutAs('DDD_POSTER')
    expect(screen.getByText('DDD POSTER')).toBeInTheDocument()
  })

  it('links out to the statistics dashboard in a new tab', () => {
    renderLayoutAs('ADMIN')
    const stats = screen.getByRole('link', { name: /statistics/i })
    expect(stats).toHaveAttribute('href', 'https://stats.hubble.cafe')
    expect(stats).toHaveAttribute('target', '_blank')
    expect(stats).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('Layout skip link and focus on navigation', () => {
  function renderAdmin() {
    mockUseRole.mockReturnValue({
      user: { id: 1, email: 'staff@hubble.cafe', displayName: 'Staff', role: 'EDITOR' },
      role: 'EDITOR', isLoading: false, error: null, refetch: () => {},
    })
    Element.prototype.scrollIntoView = vi.fn()
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<p>Dashboard content</p>} />
            <Route path="/menu" element={<p>Menu content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('the first Tab reaches "Skip to content", which moves focus to the main content', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('after navigating, the content area starts at the top with focus on the new page', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const main = screen.getByRole('main')
    main.scrollTop = 400
    expect(main).not.toHaveFocus()

    const nav = screen.getByRole('navigation', { name: 'Admin' })
    await user.click(within(nav).getByText('Menu'))
    expect(await screen.findByText('Menu content')).toBeInTheDocument()
    expect(main).toHaveFocus()
    expect(main.scrollTop).toBe(0)
  })
})
