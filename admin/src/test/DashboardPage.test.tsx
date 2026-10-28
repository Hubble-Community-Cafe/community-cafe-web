import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '../pages/DashboardPage'
import { useRole } from '../lib/RoleContext'
import { fetchAuditLog, fetchDailyDishes, fetchEvents, fetchOverrides, type AdminUser } from '../lib/api'
import { adminUser, presetUser, staffUser } from './access'

vi.mock('../lib/RoleContext', () => ({ useRole: vi.fn() }))
vi.mock('../lib/api', () => ({
  fetchDailyDishes: vi.fn(),
  fetchEvents: vi.fn(),
  fetchOverrides: vi.fn(),
  fetchAuditLog: vi.fn(),
}))

function renderAs(user: AdminUser) {
  vi.mocked(useRole).mockReturnValue({ user, role: user.role, isLoading: false, error: null, refetch: () => {} })
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

describe('DashboardPage access', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fetchDailyDishes).mockResolvedValue([])
    vi.mocked(fetchEvents).mockResolvedValue([])
    vi.mocked(fetchOverrides).mockResolvedValue([])
    vi.mocked(fetchAuditLog).mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 })
  })

  it('tells a new account to ask an admin, and loads nothing it may not see', () => {
    renderAs(staffUser())

    expect(screen.getByText(/do not have access to any part of the admin yet/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Menu' })).not.toBeInTheDocument()
    expect(fetchEvents).not.toHaveBeenCalled()
    expect(fetchOverrides).not.toHaveBeenCalled()
    expect(fetchDailyDishes).not.toHaveBeenCalled()
    expect(fetchAuditLog).not.toHaveBeenCalled()
  })

  it('summarises what someone may edit and view, with tiles for those tabs only', () => {
    renderAs(staffUser({ EVENTS: 'EDIT', MENU: 'VIEW', BOARD: 'VIEW' }))

    expect(screen.getByText('You can edit Events.')).toBeInTheDocument()
    expect(screen.getByText('You can view Menu and Board.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Vacancies' })).not.toBeInTheDocument()
    expect(fetchEvents).toHaveBeenCalled()
    expect(fetchOverrides).not.toHaveBeenCalled()
  })

  it('shows the daily dish widget to whoever may post the dish', async () => {
    renderAs(presetUser('DDD_POSTER'))
    expect(fetchDailyDishes).toHaveBeenCalled()
    expect(fetchAuditLog).not.toHaveBeenCalled()
  })

  it('gives an admin the full summary and the recent activity', async () => {
    renderAs(adminUser())
    expect(screen.getByText('Full access, including users and the audit log.')).toBeInTheDocument()
    expect(await screen.findByText('Recent activity')).toBeInTheDocument()
    expect(fetchAuditLog).toHaveBeenCalled()
  })
})
