import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vacancy } from '@cafe/shared-web/testing'
import { VacanciesPage } from '../pages/VacanciesPage'

const getVacancies = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getVacancies,
  reportApiFailure,
}))

const renderPage = () => render(<MemoryRouter><VacanciesPage /></MemoryRouter>)

describe('Meteor VacanciesPage', () => {
  beforeEach(() => {
    getVacancies.mockReset()
    reportApiFailure.mockReset()
  })

  it('asks for the Meteor vacancies and lists them after a loading line', async () => {
    getVacancies.mockResolvedValue([vacancy({ title: 'Kok', applyEmail: 'jobs@hubble.cafe' })])
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByText('Kok')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply' })).toHaveAttribute('href', 'mailto:jobs@hubble.cafe')
    expect(getVacancies).toHaveBeenCalledWith('METEOR')
  })

  it('prefers the apply link over the email and opens it in a new tab', async () => {
    getVacancies.mockResolvedValue([
      vacancy({ applyLink: 'https://example.org/apply', applyEmail: 'jobs@hubble.cafe' }),
    ])
    renderPage()
    const apply = await screen.findByRole('link', { name: 'Apply' })
    expect(apply).toHaveAttribute('href', 'https://example.org/apply')
    expect(apply).toHaveAttribute('target', '_blank')
    expect(apply).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('always shows the intro, without a general application address', async () => {
    getVacancies.mockResolvedValue([])
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Vacancies' })).toBeInTheDocument()
    expect(screen.getByText(/The open positions are listed below\.$/)).toBeInTheDocument()
    await screen.findByText('No open positions at the moment. Check back soon!')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps the line breaks typed in the description', async () => {
    getVacancies.mockResolvedValue([
      vacancy({ description: '26-28 uur\nMaandag t/m vrijdag\nGeen weekenden' }),
    ])
    renderPage()
    const description = await screen.findByText(/26-28 uur/)
    expect(description.textContent).toBe('26-28 uur\nMaandag t/m vrijdag\nGeen weekenden')
    expect(description).toHaveClass('whitespace-pre-line')
  })

  it('shows an error instead of the empty line when loading fails, and reports it', async () => {
    getVacancies.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the open positions. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText(/No open positions/)).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('vacancies', expect.any(Error))
  })
})
