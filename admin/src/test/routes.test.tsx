import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderInDataRouter } from './renderInDataRouter'
import App, { PAGES } from '../App'
import { NAV_ITEMS } from '../navigation'
import { fetchCurrentUser } from '../lib/api'
import { adminUser, staffUser } from './access'

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  fetchCurrentUser: vi.fn(),
}))

describe('admin routes come from the nav list', () => {
  it('has a page for every nav item and a nav item for every page', () => {
    const navPaths = NAV_ITEMS.map((item) => item.to).filter((to) => to !== '/')
    expect(Object.keys(PAGES).sort()).toEqual([...navPaths].sort())
  })

  it('gates every page except the dashboard', () => {
    expect(NAV_ITEMS.filter((item) => item.to !== '/' && item.requires === undefined)).toEqual([])
  })
})

/** Opening a page by its address checks the same access the menu does. */
describe('opening a page by its address', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline in tests')))
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'e2e-user' }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })

  it('sends someone without access to the dashboard', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(staffUser({ EVENTS: 'EDIT' }))
    renderInDataRouter(<App />, ['/menu'])

    expect(await screen.findByRole('heading', { name: /^Welcome/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('opens Screens with screen-poster access alone, as its nav item says', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(staffUser({ SCREEN_POSTERS: 'VIEW' }))
    renderInDataRouter(<App />, ['/screens'])

    expect(await screen.findByRole('heading', { level: 1, name: 'Screens' })).toBeInTheDocument()
  })

  it('keeps the admin pages for admins', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(staffUser({ EVENTS: 'EDIT' }))
    const { unmount } = renderInDataRouter(<App />, ['/users'])
    expect(await screen.findByRole('heading', { name: /^Welcome/ })).toBeInTheDocument()
    unmount()

    vi.mocked(fetchCurrentUser).mockResolvedValue(adminUser())
    renderInDataRouter(<App />, ['/users'])
    expect(await screen.findByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument()
  })
})
