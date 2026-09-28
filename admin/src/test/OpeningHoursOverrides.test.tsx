import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { OpeningHoursPage } from '../pages/OpeningHoursPage'
import {
  createOverride, fetchOverrides, fetchWeeklyHours, updateOverride, type HoursOverride,
} from '../lib/api'
import { usePermissions } from '../lib/usePermissions'

vi.mock('../lib/api', () => ({
  fetchWeeklyHours: vi.fn(),
  fetchOverrides: vi.fn(),
  createOverride: vi.fn(),
  updateOverride: vi.fn(),
  deleteOverride: vi.fn(),
  upsertDay: vi.fn(),
  closeDay: vi.fn(),
}))
vi.mock('../lib/usePermissions', () => ({ usePermissions: vi.fn() }))

const permissions = (canEditContent: boolean) => vi.mocked(usePermissions).mockReturnValue({
  isViewer: true, isDddPoster: canEditContent, isEditor: canEditContent, isAdmin: false,
  canEditContent, canEditDailyDish: canEditContent, canManageUsers: false, canViewAuditLog: false,
})

const override = (o: Partial<HoursOverride>): HoursOverride => ({
  id: 1, bar: 'HUBBLE', date: '2030-12-24', closed: true, open: null, close: null, note: null, ...o,
})

const renderPage = () => render(<MemoryRouter initialEntries={['/hours']}><OpeningHoursPage /></MemoryRouter>)

describe('OpeningHoursPage date overrides', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    permissions(true)
    vi.mocked(fetchWeeklyHours).mockResolvedValue([])
    vi.mocked(fetchOverrides).mockResolvedValue([
      override({ id: 1, date: '2030-12-24', closed: false, open: '20:00', close: '02:00', note: 'LED Party' }),
      override({ id: 2, date: '2030-12-25', closed: false }),
      override({ id: 3, date: '2030-12-26', closed: true, note: 'Christmas' }),
    ])
  })

  it('shows the times of an open override, plain "Open" without times, and "Closed"', async () => {
    renderPage()
    const row = async (date: string) => (await screen.findByText(date)).closest('li')!
    expect(within(await row('2030-12-24')).getByText('Open 20:00 to 02:00')).toBeInTheDocument()
    expect(within(await row('2030-12-25')).getByText('Open')).toBeInTheDocument()
    expect(within(await row('2030-12-26')).getByText('Closed')).toBeInTheDocument()
  })

  it('offers times only for an open override, and sends them', async () => {
    vi.mocked(createOverride).mockResolvedValue(override({ id: 9, date: '2031-01-02', closed: false, open: '16:00', close: '23:00' }))
    const user = userEvent.setup()
    renderPage()
    const form = await screen.findByRole('form', { name: 'Add an override' })
    expect(within(form).queryByLabelText('Opens (optional)')).not.toBeInTheDocument()

    await user.type(within(form).getByLabelText('Date'), '2031-01-02')
    await user.selectOptions(within(form).getByLabelText('Status'), 'open')
    await user.type(within(form).getByLabelText('Opens (optional)'), '16:00')
    await user.type(within(form).getByLabelText('Closes (optional)'), '23:00')
    await user.click(within(form).getByRole('button', { name: 'Add' }))

    expect(createOverride).toHaveBeenCalledWith('HUBBLE',
      { date: '2031-01-02', closed: false, open: '16:00', close: '23:00', note: null })
    expect(await screen.findByText('Open 16:00 to 23:00')).toBeInTheDocument()
  })

  it('asks for both times before sending', async () => {
    const user = userEvent.setup()
    renderPage()
    const form = await screen.findByRole('form', { name: 'Add an override' })
    await user.type(within(form).getByLabelText('Date'), '2031-01-02')
    await user.selectOptions(within(form).getByLabelText('Status'), 'open')
    await user.type(within(form).getByLabelText('Opens (optional)'), '20:00')
    await user.click(within(form).getByRole('button', { name: 'Add' }))

    expect(within(form).getByRole('alert')).toHaveTextContent('Enter both an opening and a closing time')
    expect(createOverride).not.toHaveBeenCalled()
  })

  it('edits an existing override in place', async () => {
    vi.mocked(updateOverride).mockResolvedValue(
      override({ id: 1, date: '2030-12-24', closed: false, open: '21:00', close: '03:00', note: 'LED Party' }))
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit the override for 2030-12-24' }))

    const form = screen.getByRole('form', { name: 'Edit the override for 2030-12-24' })
    expect(within(form).getByLabelText('Date')).toHaveValue('2030-12-24')
    expect(within(form).getByLabelText('Note (optional)')).toHaveValue('LED Party')
    const opens = within(form).getByLabelText('Opens (optional)')
    await user.clear(opens)
    await user.type(opens, '21:00')
    const closes = within(form).getByLabelText('Closes (optional)')
    await user.clear(closes)
    await user.type(closes, '03:00')
    await user.click(within(form).getByRole('button', { name: /Save changes/ }))

    expect(updateOverride).toHaveBeenCalledWith(1,
      { date: '2030-12-24', closed: false, open: '21:00', close: '03:00', note: 'LED Party' })
    expect(await screen.findByText('Open 21:00 to 03:00')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: /Edit the override/ })).not.toBeInTheDocument()
  })

  it("shows the backend's message, for example for a date that already has an override", async () => {
    vi.mocked(updateOverride).mockRejectedValue(
      new Error('There is already an override for 26 December 2030. Edit that one instead.'))
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit the override for 2030-12-24' }))
    const form = screen.getByRole('form', { name: 'Edit the override for 2030-12-24' })
    await user.click(within(form).getByRole('button', { name: /Save changes/ }))

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'There is already an override for 26 December 2030. Edit that one instead.')
  })

  it('cancelling an edit shows the row again', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit the override for 2030-12-24' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Open 20:00 to 02:00')).toBeInTheDocument()
  })

  it('a viewer sees the overrides but cannot add or edit them', async () => {
    permissions(false)
    renderPage()
    expect(await screen.findByText('Open 20:00 to 02:00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit the override/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Add an override' })).not.toBeInTheDocument()
  })
})
