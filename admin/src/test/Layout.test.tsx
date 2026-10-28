import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderInDataRouter } from './renderInDataRouter'
import { Layout } from '../components/Layout'
import { useRole } from '../lib/RoleContext'
import type { AdminUser } from '../lib/api'
import { adminUser, presetUser, staffUser } from './access'

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({ instance: { logoutRedirect: vi.fn() } }),
}))
vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))

const mockUseRole = vi.mocked(useRole)

function renderLayoutAs(user: AdminUser) {
  mockUseRole.mockReturnValue({ user, role: user.role, isLoading: false, error: null, refetch: () => {} })
  return renderInDataRouter(<Layout />)
}

describe('Layout access-gated navigation', () => {
  it('shows only the Dashboard to a new account', () => {
    renderLayoutAs(staffUser())
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument()
    for (const label of ['Menu', 'Daily dish', 'Events', 'Media', 'Screens', 'Users', 'Audit log']) {
      expect(within(nav).queryByText(label)).not.toBeInTheDocument()
    }
  })

  it('shows exactly the tabs someone may open', () => {
    renderLayoutAs(staffUser({ EVENTS: 'EDIT', BOARD: 'VIEW' }))
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Events')).toBeInTheDocument()
    expect(within(nav).getByText('Board')).toBeInTheDocument()
    expect(within(nav).queryByText('Menu')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Screens')).not.toBeInTheDocument()
  })

  it('shows Screens to someone who may only pick its posters', () => {
    renderLayoutAs(staffUser({ SCREEN_POSTERS: 'EDIT' }))
    expect(within(screen.getByRole('navigation', { name: 'Admin' })).getByText('Screens')).toBeInTheDocument()
  })

  it('keeps the old viewer tabs, without the admin area', () => {
    renderLayoutAs(presetUser('VIEWER'))
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Menu')).toBeInTheDocument()
    expect(within(nav).getByText('Daily dish')).toBeInTheDocument()
    expect(within(nav).getByText('Screens')).toBeInTheDocument()
    expect(within(nav).queryByText('Users')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Audit log')).not.toBeInTheDocument()
  })

  it('shows the admin area to an admin', () => {
    renderLayoutAs(adminUser())
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByText('Users')).toBeInTheDocument()
    expect(within(nav).getByText('Audit log')).toBeInTheDocument()
  })
})

describe('Layout footer', () => {
  it('shows an admin badge for an admin', () => {
    renderLayoutAs(adminUser())
    expect(screen.getByText('Admin', { selector: 'span' })).toBeInTheDocument()
  })

  it('shows a staff badge for everyone else, whatever their old role', () => {
    renderLayoutAs(presetUser('EDITOR'))
    expect(screen.getByText('Staff', { selector: 'span' })).toBeInTheDocument()
  })

  it('links out to the statistics dashboard in a new tab', () => {
    renderLayoutAs(adminUser())
    const stats = screen.getByRole('link', { name: /statistics/i })
    expect(stats).toHaveAttribute('href', 'https://stats.hubble.cafe')
    expect(stats).toHaveAttribute('target', '_blank')
    expect(stats).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('Layout brand link', () => {
  it('names the home link after its visible text (WCAG 2.5.3 label in name)', () => {
    renderLayoutAs(presetUser('VIEWER'))
    // The brand renders twice (desktop sidebar and mobile top bar).
    const links = screen.getAllByRole('link', { name: 'Staff & board admin home' })
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/')
      expect(link.getAttribute('aria-label')).toContain(link.textContent)
    }
  })
})

describe('Layout skip link and focus on navigation', () => {
  function renderAdmin() {
    mockUseRole.mockReturnValue({
      user: presetUser('EDITOR'), role: 'EDITOR', isLoading: false, error: null, refetch: () => {},
    })
    Element.prototype.scrollIntoView = vi.fn()
    return renderInDataRouter(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>Dashboard content</p>} />
          <Route path="/menu" element={<p>Menu content</p>} />
        </Route>
      </Routes>,
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
