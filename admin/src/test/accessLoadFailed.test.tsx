import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderInDataRouter } from './renderInDataRouter'
import App from '../App'
import { fetchAuditLog, fetchCurrentUser, fetchDailyDishes, fetchEvents, fetchOverrides } from '../lib/api'
import { presetUser } from './access'

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  fetchCurrentUser: vi.fn(),
  fetchDailyDishes: vi.fn(),
  fetchEvents: vi.fn(),
  fetchOverrides: vi.fn(),
  fetchAuditLog: vi.fn(),
}))

/** Like main.tsx (a data router), signed in through the e2e bridge instead of Microsoft. */
const renderApp = (path = '/events') => renderInDataRouter(<App />, [path])

describe('when loading your own access fails', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'e2e-user' }
    vi.mocked(fetchDailyDishes).mockResolvedValue([])
    vi.mocked(fetchEvents).mockResolvedValue([])
    vi.mocked(fetchOverrides).mockResolvedValue([])
    vi.mocked(fetchAuditLog).mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 })
  })
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__
  })

  /** It used to look exactly like having no access: "ask an admin", for a dropped connection. */
  it('says the access could not be loaded, not that there is none', async () => {
    vi.mocked(fetchCurrentUser).mockRejectedValue(new TypeError('Failed to fetch'))
    renderApp()

    expect(await screen.findByRole('heading', { name: 'We couldn’t load your access' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Your access has not changed')
    expect(screen.queryByText(/do not have access/i)).not.toBeInTheDocument()
  })

  it('loads the admin once trying again works', async () => {
    vi.mocked(fetchCurrentUser)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(presetUser('EDITOR'))
    renderApp('/')

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('You can edit', { exact: false })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'We couldn’t load your access' })).not.toBeInTheDocument()
    expect(fetchCurrentUser).toHaveBeenCalledTimes(2)
  })
})
