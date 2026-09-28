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

describe('Hubble VacanciesPage', () => {
  beforeEach(() => {
    getVacancies.mockReset()
    reportApiFailure.mockReset()
  })

  it('shows a loading line, then the open positions with their apply link', async () => {
    getVacancies.mockResolvedValue([vacancy({ title: 'Bartender', applyEmail: 'jobs@hubble.cafe' })])
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Open positions' })).toBeInTheDocument()
    expect(screen.getByText('Bartender')).toBeInTheDocument()
    expect(getVacancies).toHaveBeenCalledWith('HUBBLE')
  })

  it('without vacancies it shows only the general text, no list', async () => {
    getVacancies.mockResolvedValue([])
    renderPage()
    await vi.waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Open positions' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Could not load/)).not.toBeInTheDocument()
  })

  it('shows an error and reports it when loading fails', async () => {
    getVacancies.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the open positions. Please try again later.')).toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('vacancies', expect.any(Error))
  })
})
