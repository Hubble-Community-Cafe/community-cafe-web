import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersPage } from '../pages/UsersPage'
import { useRole } from '../lib/RoleContext'
import { fetchAllUsers, updateUserAccess, type AdminUser } from '../lib/api'
import { preset } from '../lib/access'
import { adminUser, presetUser, staffUser } from './access'

vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))
vi.mock('../lib/api', () => ({ fetchAllUsers: vi.fn(), updateUserAccess: vi.fn() }))

const me: AdminUser = { ...adminUser(), id: 1, email: 'me@hubble.cafe', displayName: 'Me' }
const newcomer: AdminUser = { ...staffUser(), id: 2, email: 'new@hubble.cafe', displayName: 'Newcomer' }
const viewer: AdminUser = { ...presetUser('VIEWER'), id: 3, email: 'view@hubble.cafe', displayName: 'Vera' }

const renderPage = () => render(<MemoryRouter initialEntries={['/users']}><UsersPage /></MemoryRouter>)

/** The level radio for one tab inside the open access form. */
const level = (tab: string, name: 'Hidden' | 'View' | 'Edit') =>
  within(screen.getByRole('radiogroup', { name: tab })).getByRole('radio', { name })

describe('UsersPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(useRole).mockReturnValue({ user: me, role: 'ADMIN', isLoading: false, error: null, refetch: () => {} })
    vi.mocked(fetchAllUsers).mockResolvedValue([me, newcomer, viewer])
  })

  it('summarises each person and keeps your own access out of reach', async () => {
    renderPage()

    expect(await screen.findByText('No access yet')).toBeInTheDocument()
    expect(screen.getByText('Admin: full access')).toBeInTheDocument()
    expect(screen.getByText('Edits 1 tab, views 8 tabs')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change access for Me' })).not.toBeInTheDocument()
    expect(screen.getByText(/ask another admin/)).toBeInTheDocument()
  })

  it('reports a failed load', async () => {
    vi.mocked(fetchAllUsers).mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Failed to load users.')).toBeInTheDocument()
  })

  it('saves the levels picked per tab and shows the new summary', async () => {
    const user = userEvent.setup()
    vi.mocked(updateUserAccess).mockResolvedValue({ ...newcomer, permissions: { ...newcomer.permissions, EVENTS: 'EDIT', MENU: 'VIEW' } })
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Newcomer' }))
    await user.click(level('Events', 'Edit'))
    await user.click(level('Menu', 'View'))
    await user.click(screen.getByRole('button', { name: /Save access/ }))

    await waitFor(() => expect(updateUserAccess).toHaveBeenCalledWith(2, {
      admin: false,
      permissions: { ...newcomer.permissions, EVENTS: 'EDIT', MENU: 'VIEW' },
    }))
    expect(await screen.findByText('Edits 1 tab, views 1 tab')).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('fills every tab from a preset', async () => {
    const user = userEvent.setup()
    vi.mocked(updateUserAccess).mockResolvedValue(newcomer)
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Newcomer' }))
    await user.click(screen.getByRole('button', { name: 'DDD poster' }))
    expect(level('Daily dish', 'Edit')).toBeChecked()
    expect(level('Menu', 'View')).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Save access/ }))

    await waitFor(() => expect(updateUserAccess).toHaveBeenCalledWith(2, {
      admin: false, permissions: preset('DDD_POSTER'),
    }))
  })

  it('takes every tab away with No access', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Vera' }))
    await user.click(screen.getByRole('button', { name: 'No access' }))

    expect(level('Menu', 'Hidden')).toBeChecked()
    expect(level('Screens', 'Hidden')).toBeChecked()
  })

  it('makes someone admin, which covers every tab', async () => {
    const user = userEvent.setup()
    vi.mocked(updateUserAccess).mockResolvedValue({ ...viewer, admin: true })
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Vera' }))
    await user.click(screen.getByRole('checkbox', { name: /Admin/ }))
    expect(level('Menu', 'Edit')).toBeChecked()
    expect(level('Menu', 'View')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Editor' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Save access/ }))

    await waitFor(() => expect(vi.mocked(updateUserAccess).mock.calls[0][1].admin).toBe(true))
  })

  it('offers Screen posters only as on or off', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Newcomer' }))
    const posters = screen.getByRole('radiogroup', { name: 'Screen posters' })
    expect(within(posters).getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(['HIDDEN', 'EDIT'])
  })

  it('keeps the form open with a message when saving fails', async () => {
    const user = userEvent.setup()
    vi.mocked(updateUserAccess).mockRejectedValue(new Error('nope'))
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Newcomer' }))
    await user.click(screen.getByRole('button', { name: /Save access/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save this access')
    expect(screen.getByRole('button', { name: /Save access/ })).toBeEnabled()
  })

  it('closes the form on cancel without saving', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change access for Newcomer' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('radiogroup', { name: 'Menu' })).not.toBeInTheDocument()
    expect(updateUserAccess).not.toHaveBeenCalled()
  })
})
