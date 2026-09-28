import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { cafeEvent } from '@cafe/shared-web/testing'
import { EventsPage } from '../pages/EventsPage'

const getUpcomingEvents = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getUpcomingEvents,
  reportApiFailure,
}))

const renderPage = () => render(<MemoryRouter><EventsPage /></MemoryRouter>)

describe('Meteor EventsPage (agenda)', () => {
  beforeEach(() => {
    getUpcomingEvents.mockReset()
    reportApiFailure.mockReset()
  })

  it('asks for the Meteor events and renders them after a loading line', async () => {
    getUpcomingEvents.mockResolvedValue([cafeEvent({ bar: 'METEOR', title: 'Poetry night', date: '2030-10-05' })])
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Poetry night' })).toBeInTheDocument()
    expect(screen.getByText(/5 October 2030/)).toBeInTheDocument()
    expect(getUpcomingEvents).toHaveBeenCalledWith('METEOR')
  })

  it('says so when there are no upcoming events', async () => {
    getUpcomingEvents.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No upcoming events at the moment. Check back soon!')).toBeInTheDocument()
  })

  it('shows an error instead of an empty agenda when loading fails, and reports it', async () => {
    getUpcomingEvents.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the events. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText(/No upcoming events/)).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('events', expect.any(Error))
  })
})
