import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Footer } from '../components/Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it("shows Meteor's contact details", () => {
    renderFooter()
    expect(screen.getByText(/Blauwe loper 60/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'info@meteor.cafe' })).toHaveAttribute(
      'href',
      'mailto:info@meteor.cafe',
    )
    expect(screen.getByText(/\+31 \(0\)40 247 8507/)).toBeInTheDocument()
  })

  it('notes the UVH conditions', () => {
    renderFooter()
    expect(screen.getByText(/UVH/)).toBeInTheDocument()
  })
})
