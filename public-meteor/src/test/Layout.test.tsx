import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { barStatus } from '@cafe/shared-web/testing'
import { Layout } from '../components/Layout'

const getBarStatus = vi.hoisted(() => vi.fn())
const getWeeklyHours = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getBarStatus,
  getWeeklyHours,
  reportApiFailure,
}))

const renderLayout = () => render(<MemoryRouter><Layout><p>Page content</p></Layout></MemoryRouter>)

describe('Meteor Layout status banner', () => {
  beforeEach(() => {
    getBarStatus.mockReset()
    getWeeklyHours.mockReset()
    reportApiFailure.mockReset()
    getWeeklyHours.mockResolvedValue([])
  })

  it('shows the closed banner for Meteor', async () => {
    getBarStatus.mockResolvedValue(barStatus({ bar: 'METEOR', isOpen: false }))
    renderLayout()
    expect(await screen.findByRole('status')).toHaveTextContent('Sadly we are closed')
    expect(getBarStatus).toHaveBeenCalledWith('METEOR')
  })

  it('a failed status load shows no banner, keeps the page and reports it', async () => {
    getBarStatus.mockRejectedValue(new Error('down'))
    getWeeklyHours.mockRejectedValue(new Error('down'))
    renderLayout()
    await vi.waitFor(() => expect(reportApiFailure).toHaveBeenCalledWith('bar-status', expect.any(Error)))
    await vi.waitFor(() => expect(reportApiFailure).toHaveBeenCalledWith('footer-hours', expect.any(Error)))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
