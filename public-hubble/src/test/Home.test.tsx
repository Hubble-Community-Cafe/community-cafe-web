import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { hoursOverride, weeklyHours } from '@cafe/shared-web/testing'
import { Home } from '../pages/Home'

const getWeeklyHours = vi.hoisted(() => vi.fn())
const getUpcomingOverrides = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getWeeklyHours,
  getUpcomingOverrides,
  reportApiFailure,
}))

const renderPage = () => render(<MemoryRouter><Home /></MemoryRouter>)
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const

describe('Hubble Home opening times', () => {
  beforeEach(() => {
    getWeeklyHours.mockReset()
    getUpcomingOverrides.mockReset()
    reportApiFailure.mockReset()
    getUpcomingOverrides.mockResolvedValue([])
  })

  it('shows loading, then the grouped hours with the days without hours as closed', async () => {
    getWeeklyHours.mockResolvedValue(WEEKDAYS.map((day, i) => weeklyHours({ id: i + 1, dayOfWeek: day })))
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()

    expect(await screen.findByText('12:00 – 23:00')).toBeInTheDocument()
    const saturday = screen.getByText('Saturday').closest('div')!
    expect(within(saturday).getByText('Closed')).toBeInTheDocument()
    expect(getWeeklyHours).toHaveBeenCalledWith('HUBBLE')
  })

  it('lists special dates such as a closed holiday with its note', async () => {
    getWeeklyHours.mockResolvedValue([weeklyHours()])
    getUpcomingOverrides.mockResolvedValue([hoursOverride({ date: '2030-12-25', closed: true, note: 'Christmas' })])
    renderPage()
    expect(await screen.findByText('Special dates')).toBeInTheDocument()
    expect(screen.getByText('(Christmas)')).toBeInTheDocument()
  })

  it('says opening times are coming when none are set', async () => {
    getWeeklyHours.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Opening times coming soon.')).toBeInTheDocument()
  })

  it('shows an error instead of "coming soon" when loading fails, and reports it', async () => {
    getWeeklyHours.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the opening times. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('Opening times coming soon.')).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('opening-hours', expect.any(Error))
  })

  it('a failure to load the special dates is reported but does not hide the regular hours', async () => {
    getWeeklyHours.mockResolvedValue([weeklyHours()])
    getUpcomingOverrides.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('12:00 – 23:00')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(reportApiFailure).toHaveBeenCalledWith('opening-hours-overrides', expect.any(Error)))
  })
})
