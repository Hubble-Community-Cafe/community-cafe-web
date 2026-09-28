import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { weeklyHours } from '@cafe/shared-web/testing'
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

describe('Meteor Home opening hours', () => {
  beforeEach(() => {
    getWeeklyHours.mockReset()
    getUpcomingOverrides.mockReset()
    reportApiFailure.mockReset()
    getUpcomingOverrides.mockResolvedValue([])
  })

  it('shows loading, then the grouped hours and the closed weekend', async () => {
    getWeeklyHours.mockResolvedValue(WEEKDAYS.map((day, i) => weeklyHours({ id: i + 1, bar: 'METEOR', dayOfWeek: day })))
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByText('12:00 to 23:00')).toBeInTheDocument()
    expect(screen.getByText('Saturday, Sunday')).toBeInTheDocument()
    expect(getWeeklyHours).toHaveBeenCalledWith('METEOR')
  })

  it('a failed load shows an error, never "All days: Closed", and is reported', async () => {
    getWeeklyHours.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the opening hours. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('All days')).not.toBeInTheDocument()
    expect(screen.queryByText('Closed')).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('opening-hours', expect.any(Error))
  })

  it('a failure to load the special dates is reported but keeps the regular hours', async () => {
    getWeeklyHours.mockResolvedValue([weeklyHours({ bar: 'METEOR' })])
    getUpcomingOverrides.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('12:00 to 23:00')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(reportApiFailure).toHaveBeenCalledWith('opening-hours-overrides', expect.any(Error)))
  })
})
