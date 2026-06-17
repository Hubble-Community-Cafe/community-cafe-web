import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '../components/Header'

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('renders the Hubble brand and primary nav groups', () => {
    renderHeader()
    expect(screen.getByLabelText('Hubble home')).toBeInTheDocument()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Home', 'Community', 'Cafe', 'Events', 'Vacancies', 'Contact']) {
      expect(within(primary).getByText(label)).toBeInTheDocument()
    }
  })

  it('links reservations out to the external harry app in a new tab', () => {
    renderHeader()
    const reservationLinks = screen.getAllByRole('link', { name: /make a reservation/i })
    expect(reservationLinks[0]).toHaveAttribute('href', 'https://harry.hubble.cafe')
    expect(reservationLinks[0]).toHaveAttribute('target', '_blank')
    expect(reservationLinks[0]).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('toggles the mobile menu', async () => {
    const user = userEvent.setup()
    renderHeader()
    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument()
    await user.click(toggle)
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
  })
})
