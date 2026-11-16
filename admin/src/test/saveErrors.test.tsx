import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmActionProvider } from '../components/ConfirmActionProvider'
import { EventsPage } from '../pages/EventsPage'
import { createEvent, fetchEvents } from '../lib/api'
import { ActionError } from '../lib/actionError'
import { usePermissions } from '../lib/usePermissions'
import { permissionsFor, staffUser } from './access'

vi.mock('../lib/api', () => ({ fetchEvents: vi.fn(), createEvent: vi.fn() }))
vi.mock('../lib/usePermissions', () => ({ usePermissions: vi.fn() }))

async function submitNewEvent() {
  render(<MemoryRouter initialEntries={['/events']}><ConfirmActionProvider><EventsPage /></ConfirmActionProvider></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: /Add event/ }))
  fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Pub quiz' } })
  fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: '2030-01-10' } })
  fireEvent.click(screen.getByRole('button', { name: /Create event/ }))
}

describe('saving an event the backend refuses', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(usePermissions).mockReturnValue(permissionsFor(staffUser({ EVENTS: 'EDIT' })))
    vi.mocked(fetchEvents).mockResolvedValue([])
  })

  it("shows the backend's reason instead of a bare 'Failed to save'", async () => {
    vi.mocked(createEvent).mockRejectedValue(new ActionError('Start time must be a time like 20:30'))
    await submitNewEvent()

    expect(await screen.findByText('Start time must be a time like 20:30')).toBeInTheDocument()
    expect(screen.queryByText('Failed to save event')).not.toBeInTheDocument()
  })

  it('keeps the plain text when there is no reason fit to show', async () => {
    vi.mocked(createEvent).mockRejectedValue(new Error('Request failed (500) for /api/admin/events'))
    await submitNewEvent()

    expect(await screen.findByText('Failed to save event')).toBeInTheDocument()
    expect(screen.queryByText(/Request failed/)).not.toBeInTheDocument()
  })
})
