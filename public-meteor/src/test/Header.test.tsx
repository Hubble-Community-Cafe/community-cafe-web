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
  it('renders the Meteor brand and primary nav groups', () => {
    renderHeader()
    expect(screen.getByLabelText('Meteor home')).toBeInTheDocument()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Home', 'Agenda', 'Community', 'Menu', 'Reservation']) {
      // "Menu" appears twice (the dropdown group plus its overview link), so
      // assert at least one match rather than exactly one.
      expect(within(primary).getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('links reservations out to the external app in a new tab', () => {
    renderHeader()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    const reservation = within(primary).getByRole('link', { name: /reservation/i })
    expect(reservation).toHaveAttribute('href', 'https://harry.hubble.cafe')
    expect(reservation).toHaveAttribute('target', '_blank')
    expect(reservation).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('toggles the mobile menu', async () => {
    const user = userEvent.setup()
    renderHeader()
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
  })
})
