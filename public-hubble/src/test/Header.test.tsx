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
    expect(screen.getByRole('img', { name: /hubble community cafe/i })).toBeInTheDocument()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    // Top-level groups: Community, Cafe, Contact only (Home removed; Vacancies is under Cafe)
    for (const label of ['Community', 'Cafe', 'Contact']) {
      expect(within(primary).getByText(label)).toBeInTheDocument()
    }
    expect(within(primary).queryByText('Home')).not.toBeInTheDocument()
    // Vacancies lives inside the Cafe dropdown, not as a top-level group button
    const cafeButton = within(primary).getByRole('button', { name: /cafe/i })
    expect(cafeButton.closest('div')?.querySelector('a[href="/vacancies"]')).toBeTruthy()
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

  /**
   * The desktop menu is also shown on an iPad in landscape, where nothing hovers: a tap has to open
   * a dropdown. Keyboard users open it with Enter or Space and close it with Escape.
   */
  it('opens a desktop dropdown on a click or tap, and Escape closes it', async () => {
    const user = userEvent.setup()
    renderHeader()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    const button = within(primary).getByRole('button', { name: 'Community' })
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveClass('invisible')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toHaveClass('visible')
    expect(panel).not.toHaveClass('invisible')
    expect(within(panel).getByRole('link', { name: 'Board' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
    expect(panel).toHaveClass('invisible')
  })
})
