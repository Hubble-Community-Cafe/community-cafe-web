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

describe('Meteor Layout skip link and focus on navigation', () => {
  beforeAll(() => {
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })
  beforeEach(() => {
    getBarStatus.mockReset()
    getWeeklyHours.mockReset()
    getBarStatus.mockResolvedValue(barStatus({ bar: 'METEOR', isOpen: true }))
    getWeeklyHours.mockResolvedValue([])
    vi.mocked(window.scrollTo).mockClear()
  })

  const renderSite = () => render(
    <MemoryRouter initialEntries={['/']}>
      <Layout>
        <Routes>
          <Route path="/" element={<p>Home content <Link to="/agenda">Go to agenda</Link></p>} />
          <Route path="/agenda" element={<p>Agenda content</p>} />
        </Routes>
      </Layout>
    </MemoryRouter>,
  )

  it('the first Tab reaches "Skip to content", which moves focus to the main content', async () => {
    const user = userEvent.setup()
    renderSite()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('focus stays put on the first load, and moves to the new page after navigating', async () => {
    const user = userEvent.setup()
    renderSite()
    expect(screen.getByRole('main')).not.toHaveFocus()

    await user.click(screen.getByRole('link', { name: 'Go to agenda' }))
    expect(await screen.findByText('Agenda content')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
