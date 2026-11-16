import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConfirmActionProvider } from '../components/ConfirmActionProvider'
import { EventsPage } from '../pages/EventsPage'
import { OpeningHoursPage } from '../pages/OpeningHoursPage'
import { AuditLogPage } from '../pages/AuditLogPage'
import {
  fetchAuditLog, fetchEvents, fetchOverrides, fetchWeeklyHours,
  type AuditLogEntry, type CafeEvent, type HoursOverride, type Page, type WeeklyHours,
} from '../lib/api'
import { usePermissions } from '../lib/usePermissions'
import { permissionsFor, staffUser } from './access'

vi.mock('../lib/api', () => ({
  fetchEvents: vi.fn(),
  fetchWeeklyHours: vi.fn(),
  fetchOverrides: vi.fn(),
  fetchAuditLog: vi.fn(),
}))
vi.mock('../lib/usePermissions', () => ({ usePermissions: vi.fn() }))

/** A request the test answers itself, to answer it after a newer one. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

const event = (bar: 'HUBBLE' | 'METEOR', title: string): CafeEvent => ({
  id: title.length, bar, title, date: '2030-01-10', startTime: null, price: null, description: null,
  imageId: null, imageUrl: null, imageAlt: null, subscribeLink: null, published: true,
})

const inRouter = (ui: React.ReactNode, path: string) =>
  render(<MemoryRouter initialEntries={[path]}><ConfirmActionProvider>{ui}</ConfirmActionProvider></MemoryRouter>)

/**
 * Switching quickly used to let a slow answer for the previous choice land last and replace the
 * current one: Hubble's events under the heading "Meteor events".
 */
describe('a slow answer for a previous choice', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(usePermissions).mockReturnValue(permissionsFor(staffUser({ EVENTS: 'EDIT', OPENING_HOURS: 'EDIT' })))
  })

  it("never puts one bar's events under the other bar", async () => {
    const hubble = deferred<CafeEvent[]>()
    vi.mocked(fetchEvents).mockImplementation((bar) =>
      bar === 'HUBBLE' ? hubble.promise : Promise.resolve([event('METEOR', 'Meteor pub quiz')]))
    inRouter(<EventsPage />, '/events')

    fireEvent.click(screen.getByRole('button', { name: 'Meteor' }))
    expect(await screen.findByText('Meteor pub quiz')).toBeInTheDocument()

    await act(async () => hubble.resolve([event('HUBBLE', 'Hubble karaoke')]))
    expect(screen.getByRole('heading', { name: 'Meteor events' })).toBeInTheDocument()
    expect(screen.getByText('Meteor pub quiz')).toBeInTheDocument()
    expect(screen.queryByText('Hubble karaoke')).not.toBeInTheDocument()
  })

  it("never puts one bar's special days under the other bar", async () => {
    const hubbleOverrides = deferred<HoursOverride[]>()
    vi.mocked(fetchWeeklyHours).mockResolvedValue([] as WeeklyHours[])
    vi.mocked(fetchOverrides).mockImplementation((bar) =>
      bar === 'HUBBLE'
        ? hubbleOverrides.promise
        : Promise.resolve([{ id: 2, bar: 'METEOR', date: '2030-12-31', closed: true, open: null, close: null, note: 'Meteor NYE' }]))
    inRouter(<OpeningHoursPage />, '/hours')

    fireEvent.click(screen.getByRole('button', { name: 'Meteor' }))
    expect(await screen.findByText('Meteor NYE')).toBeInTheDocument()

    await act(async () => hubbleOverrides.resolve([
      { id: 1, bar: 'HUBBLE', date: '2030-12-24', closed: true, open: null, close: null, note: 'Hubble Xmas' },
    ]))
    expect(screen.getByText('Meteor NYE')).toBeInTheDocument()
    expect(screen.queryByText('Hubble Xmas')).not.toBeInTheDocument()
  })

  it('never shows audit entries that do not match the filter on screen', async () => {
    const entry = (id: number, entityType: string, entityLabel: string) => ({
      id, entityType, entityId: id, entityLabel, action: 'UPDATED', summary: `Updated ${entityLabel}`,
      actorName: 'Robin', actorEmail: null, changes: [], createdAt: '2030-01-01T12:00:00',
    }) as unknown as AuditLogEntry
    const pageOf = (content: AuditLogEntry[]): Page<AuditLogEntry> =>
      ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 50 })
    const unfiltered = deferred<Page<AuditLogEntry>>()
    vi.mocked(fetchAuditLog).mockImplementation((_page, _size, filters) =>
      filters?.entityType === 'EVENT'
        ? Promise.resolve(pageOf([entry(2, 'EVENT', 'Pub quiz')]))
        : unfiltered.promise)
    render(<MemoryRouter initialEntries={['/audit']}><AuditLogPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Filter by entity'), { target: { value: 'EVENT' } })
    await waitFor(() => expect(screen.getAllByText(/Pub quiz/).length).toBeGreaterThan(0))

    await act(async () => unfiltered.resolve(pageOf([entry(1, 'VACANCY', 'Bartender')])))
    expect(screen.getAllByText(/Pub quiz/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/Bartender/)).toHaveLength(0)
  })
})
