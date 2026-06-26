import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyPage } from '../pages/PrivacyPage'

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  )
}

describe('Meteor PrivacyPage', () => {
  it('names the controller entity and KvK', () => {
    renderPrivacy()
    expect(screen.getByText(/Bubble Paviljoen B\.V\./)).toBeInTheDocument()
    expect(screen.getByText(/95363025/)).toBeInTheDocument()
  })

  it('gives the dedicated privacy contact', () => {
    renderPrivacy()
    expect(screen.getAllByRole('link', { name: 'privacy@meteor.cafe' })[0]).toHaveAttribute(
      'href',
      'mailto:privacy@meteor.cafe',
    )
  })

  it('states that form messages are not stored on the site', () => {
    renderPrivacy()
    expect(screen.getByText(/do not store your message or your details on this website/i)).toBeInTheDocument()
  })
})
