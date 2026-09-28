import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { association } from '@cafe/shared-web/testing'
import { AssociationsPage } from '../pages/AssociationsPage'

const getAssociations = vi.hoisted(() => vi.fn())
const reportApiFailure = vi.hoisted(() => vi.fn())
vi.mock('@cafe/shared-web', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cafe/shared-web')>()),
  getAssociations,
  reportApiFailure,
}))

const renderPage = () => render(<MemoryRouter><AssociationsPage /></MemoryRouter>)

describe('Hubble AssociationsPage', () => {
  beforeEach(() => {
    getAssociations.mockReset()
    reportApiFailure.mockReset()
  })

  it('shows a skeleton, then each association with its logo', async () => {
    getAssociations.mockResolvedValue([
      association({ name: 'Inter Actief', logoUrl: '/media/ia.png', logoAlt: 'Inter Actief logo' }),
      association({ id: 2, name: 'Scintilla' }),
    ])
    renderPage()
    expect(screen.getByTestId('associations-skeleton')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'Inter Actief logo' })).toHaveAttribute('src', '/media/ia.png')
    expect(screen.getByText('Scintilla')).toBeInTheDocument()
  })

  it('says so when no associations are listed', async () => {
    getAssociations.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No associations listed yet.')).toBeInTheDocument()
  })

  it('shows an error instead of the empty text when loading fails, and reports it', async () => {
    getAssociations.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Could not load the associations. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText('No associations listed yet.')).not.toBeInTheDocument()
    expect(reportApiFailure).toHaveBeenCalledWith('associations', expect.any(Error))
  })
})
