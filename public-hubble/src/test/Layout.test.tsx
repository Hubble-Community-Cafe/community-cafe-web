import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
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

describe('Hubble Layout skip link and focus on navigation', () => {
  beforeAll(() => {
    // jsdom does not implement scrolling.
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })
  beforeEach(() => {
    getBarStatus.mockReset()
    getWeeklyHours.mockReset()
    getBarStatus.mockResolvedValue(barStatus({ isOpen: true }))
    getWeeklyHours.mockResolvedValue([])
    vi.mocked(window.scrollTo).mockClear()
  })

  const renderSite = () => render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>Home content <Link to="/events">Go to events</Link></p>} />
          <Route path="/events" element={<p>Events content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  it('the first Tab reaches "Skip to content", which moves focus to the main content', async () => {
    const user = userEvent.setup()
    renderSite()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('does not move focus on the first load', () => {
    renderSite()
    expect(screen.getByRole('main')).not.toHaveFocus()
  })

  it('after navigating, starts at the top with focus on the new page', async () => {
    const user = userEvent.setup()
    renderSite()
    await user.click(screen.getByRole('link', { name: 'Go to events' }))

    expect(await screen.findByText('Events content')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
