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

const renderLayout = () => render(<MemoryRouter><Layout /></MemoryRouter>)

describe('Hubble Layout status banner', () => {
  beforeEach(() => {
    getBarStatus.mockReset()
    getWeeklyHours.mockReset()
    reportApiFailure.mockReset()
    getWeeklyHours.mockResolvedValue([])
  })

  it('shows the closed banner with the CMS message', async () => {
    getBarStatus.mockResolvedValue(barStatus({ isOpen: false, bannerMessage: 'Closed for the exam period' }))
    renderLayout()
    expect(await screen.findByText('Closed for the exam period')).toBeInTheDocument()
    expect(getBarStatus).toHaveBeenCalledWith('HUBBLE')
  })

  it('shows no banner when open without a message', async () => {
    getBarStatus.mockResolvedValue(barStatus({ isOpen: true }))
    renderLayout()
    await vi.waitFor(() => expect(getBarStatus).toHaveBeenCalled())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('a failed status load shows no banner but is reported, and so is a failed footer', async () => {
    getBarStatus.mockRejectedValue(new Error('down'))
    getWeeklyHours.mockRejectedValue(new Error('down'))
    renderLayout()
    await vi.waitFor(() => expect(reportApiFailure).toHaveBeenCalledWith('bar-status', expect.any(Error)))
    await vi.waitFor(() => expect(reportApiFailure).toHaveBeenCalledWith('footer-hours', expect.any(Error)))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
