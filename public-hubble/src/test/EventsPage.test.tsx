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

describe('Hubble EventsPage', () => {
  beforeEach(() => {
    getUpcomingEvents.mockReset()
    reportApiFailure.mockReset()
  })

  it('asks for the Hubble events and shows a loading line meanwhile', async () => {
    getUpcomingEvents.mockResolvedValue([])
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(getUpcomingEvents).toHaveBeenCalledWith('HUBBLE')
    await screen.findByText(/No upcoming events/)
  })

  it('renders each event with its date, price and sign-up link', async () => {
    getUpcomingEvents.mockResolvedValue([
      cafeEvent({ title: 'Pub quiz', date: '2030-10-05', startTime: '20:00', price: '€2', subscribeLink: 'https://example.com/signup' }),
    ])
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Pub quiz' })).toBeInTheDocument()
    expect(screen.getByText('Saturday, 5 October 2030, 20:00')).toBeInTheDocument()
    expect(screen.getByText('€2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sign up/ })).toHaveAttribute('href', 'https://example.com/signup')
  })

  it('says so when there are no upcoming events', async () => {
    getUpcomingEvents.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No upcoming events at the moment. Check back soon!')).toBeInTheDocument()
  })

  it('shows an error instead of an empty list when loading fails, and reports it', async () => {
    const failure = new Error('network')
    getUpcomingEvents.mockRejectedValue(failure)
    renderPage()
    expect(await screen.findByText('Could not load the events. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText(/No upcoming events/)).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('events', failure)
  })

  it('keeps the line breaks the board typed in the description', async () => {
    getUpcomingEvents.mockResolvedValue([
      cafeEvent({ description: 'Board:\nChair\nSecretary' }),
    ])
    renderPage()
    const description = await screen.findByText(/Board:/)
    expect(description.textContent).toBe('Board:\nChair\nSecretary')
    expect(description).toHaveClass('whitespace-pre-line')
  })
})
