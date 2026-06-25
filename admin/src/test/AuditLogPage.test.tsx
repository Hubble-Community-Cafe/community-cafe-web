import { beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('AuditLogPage filtering', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(emptyPage)
  })

  it('loads unfiltered on mount', async () => {
    render(<AuditLogPage />)
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(0, 50, { entityType: undefined, action: undefined }),
    )
  })

  it('refetches with the selected entity filter from the first page', async () => {
    render(<AuditLogPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Filter by entity'), { target: { value: 'EVENT' } })
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(0, 50, { entityType: 'EVENT', action: undefined }),
    )
  })

  it('shows a filter-specific empty message', async () => {
    render(<AuditLogPage />)
    fireEvent.change(await screen.findByLabelText('Filter by action'), {
      target: { value: 'DELETE' },
    })
    expect(await screen.findByText('No entries match these filters.')).toBeInTheDocument()
  })
})
