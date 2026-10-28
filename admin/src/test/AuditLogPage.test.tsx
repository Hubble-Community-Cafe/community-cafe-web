import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuditLogPage } from '../pages/AuditLogPage'
import { fetchAuditLog, type AuditLogEntry, type Page } from '../lib/api'

vi.mock('../lib/api', () => ({ fetchAuditLog: vi.fn() }))

const mockFetch = vi.mocked(fetchAuditLog)

const emptyPage: Page<AuditLogEntry> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 50,
}

/** The page title's Help button reads the route, so the page renders inside a router. */
const renderPage = () => render(<MemoryRouter initialEntries={['/audit']}><AuditLogPage /></MemoryRouter>)

describe('AuditLogPage filtering', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(emptyPage)
  })

  it('loads unfiltered on mount', async () => {
    renderPage()
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(0, 50, { entityType: undefined, action: undefined }),
    )
  })

  it('refetches with the selected entity filter from the first page', async () => {
    renderPage()
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Filter by entity'), { target: { value: 'EVENT' } })
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(0, 50, { entityType: 'EVENT', action: undefined }),
    )
  })

  it('can filter on access changes', async () => {
    renderPage()
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(screen.getByRole('option', { name: 'Permissions changed' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Filter by action'), { target: { value: 'PERMISSIONS_CHANGED' } })
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(0, 50, { entityType: undefined, action: 'PERMISSIONS_CHANGED' }),
    )
  })

  it('shows a filter-specific empty message', async () => {
    renderPage()
    fireEvent.change(await screen.findByLabelText('Filter by action'), {
      target: { value: 'DELETE' },
    })
    expect(await screen.findByText('No entries match these filters.')).toBeInTheDocument()
  })
})

const entry = (e: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: 1, entityType: 'MENU_ITEM', entityId: 7, entityLabel: 'Mojito', action: 'UPDATE',
  actorEmail: 'staff@hubble.cafe', actorName: 'Staff', changes: null, summary: 'Updated item: Mojito',
  createdAt: '2030-01-01T12:00:00', ...e,
})

const pageOf = (...content: AuditLogEntry[]): Page<AuditLogEntry> => ({ ...emptyPage, content, totalElements: content.length, totalPages: 1 })

describe('AuditLogPage field changes', () => {
  beforeEach(() => mockFetch.mockReset())

  it('shows what an edit changed, old to new, behind a toggle', async () => {
    mockFetch.mockResolvedValue(pageOf(entry({
      changes: JSON.stringify([
        { field: 'Regular price', oldValue: '7.00', newValue: '7.50' },
        { field: 'Description', oldValue: null, newValue: 'With mint' },
      ]),
    })))
    renderPage()

    const toggle = await screen.findByRole('button', { name: 'Show changes (2)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Regular price:')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Regular price:')).toBeInTheDocument()
    expect(screen.getByText('7.00').tagName).toBe('DEL')
    expect(screen.getByText('7.50').tagName).toBe('INS')
    expect(screen.getByText('empty')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hide (2)' }))
    expect(screen.queryByText('Regular price:')).not.toBeInTheDocument()
  })

  it('shows the values of something added and the last values of something deleted', async () => {
    mockFetch.mockResolvedValue(pageOf(
      entry({ id: 1, action: 'CREATE', changes: JSON.stringify([{ field: 'Name', oldValue: null, newValue: 'Mojito' }]) }),
      entry({ id: 2, action: 'DELETE', changes: JSON.stringify([{ field: 'Title', oldValue: 'Quiz', newValue: null }]) }),
    ))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Show values (1)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show last values (1)' }))

    expect(screen.getByText('Mojito', { selector: 'ins' })).toBeInTheDocument()
    expect(screen.getByText('Quiz').tagName).toBe('DEL')
  })

  it('offers no toggle when an entry has no readable changes', async () => {
    mockFetch.mockResolvedValue(pageOf(
      entry({ id: 1, changes: null, summary: 'Reordered 3 items' }),
      entry({ id: 2, changes: 'not json', summary: 'Old entry' }),
    ))
    renderPage()

    expect(await screen.findByText('Reordered 3 items')).toBeInTheDocument()
    expect(screen.getByText('Old entry')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument()
  })
})
