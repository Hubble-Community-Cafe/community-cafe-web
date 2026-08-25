import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ScreensPage } from '../pages/ScreensPage'
import {
  applyScreenScene, fetchScreenScene, updateScreenSceneSettings, type ScreenSceneStatus,
} from '../lib/api'
import { usePermissions } from '../lib/usePermissions'

vi.mock('../lib/api', () => ({
  fetchScreenScene: vi.fn(),
  applyScreenScene: vi.fn(),
  updateScreenSceneSettings: vi.fn(),
}))
vi.mock('../lib/usePermissions', () => ({ usePermissions: vi.fn() }))

const mockFetch = vi.mocked(fetchScreenScene)
const mockApply = vi.mocked(applyScreenScene)
const mockUpdate = vi.mocked(updateScreenSceneSettings)
const mockPermissions = vi.mocked(usePermissions)

const status: ScreenSceneStatus = {
  available: true,
  unavailableReason: null,
  currentScene: 'OPEN',
  activePosterId: null,
  closedPosterId: 3,
  lastCallPosterId: 4,
  screens: [
    { id: 1, name: 'HubbleGeneralScreen', handler: 'CarouselPosterHandler' },
    { id: 2, name: 'PlazaScreen', handler: 'CarouselPosterHandler' },
  ],
  posters: [
    { id: 3, label: 'Closed slide.png', imageUrl: 'https://client.test/static/a.png' },
    { id: 4, label: 'Last Call slide.png', imageUrl: null },
  ],
}

const asViewer = () => mockPermissions.mockReturnValue({
  isViewer: true, isDddPoster: false, isEditor: false, isAdmin: false,
  canEditContent: false, canEditDailyDish: false, canManageUsers: false, canViewAuditLog: false,
})

const asEditor = () => mockPermissions.mockReturnValue({
  isViewer: true, isDddPoster: true, isEditor: true, isAdmin: false,
  canEditContent: true, canEditDailyDish: true, canManageUsers: false, canViewAuditLog: false,
})

describe('ScreensPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockResolvedValue(status)
    mockApply.mockResolvedValue(undefined)
    asViewer()
  })

  it('lists the screens with the handler each is on', async () => {
    render(<ScreensPage />)
    expect(await screen.findByText('HubbleGeneralScreen')).toBeInTheDocument()
    expect(screen.getAllByText('CarouselPosterHandler')).toHaveLength(2)
  })

  it('lets a viewer switch the scene and refreshes afterwards', async () => {
    render(<ScreensPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Closed/ }))

    await waitFor(() => expect(mockApply).toHaveBeenCalledWith('CLOSED'))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })

  it('surfaces the Aurora message when a switch fails', async () => {
    mockApply.mockRejectedValue(new Error('Could not switch screen "PlazaScreen" to StaticPosterHandler'))
    render(<ScreensPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Last call/ }))

    expect(await screen.findByText(/Could not switch screen "PlazaScreen"/)).toBeInTheDocument()
  })

  it('explains why the panel is unavailable instead of spinning', async () => {
    mockFetch.mockResolvedValue({
      ...status, available: false, unavailableReason: 'Aurora is not configured.',
    })
    render(<ScreensPage />)

    expect(await screen.findByText('Aurora is not configured.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Closed/ })).not.toBeInTheDocument()
  })

  it('flags a mixed state rather than guessing a scene', async () => {
    mockFetch.mockResolvedValue({ ...status, currentScene: 'MIXED' })
    render(<ScreensPage />)

    expect(await screen.findByText('Mixed')).toBeInTheDocument()
    expect(screen.getByText(/not all showing the same thing/)).toBeInTheDocument()
  })

  it('hides the poster settings from a viewer', async () => {
    render(<ScreensPage />)
    await screen.findByText('HubbleGeneralScreen')

    expect(screen.queryByLabelText('Closed')).not.toBeInTheDocument()
  })

  it('lets an editor re-point a scene at another poster', async () => {
    asEditor()
    mockUpdate.mockResolvedValue({ ...status, closedPosterId: 4 })
    render(<ScreensPage />)

    fireEvent.change(await screen.findByLabelText('Closed'), { target: { value: '4' } })

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ closedPosterId: 4, lastCallPosterId: 4 }),
    )
  })
})
