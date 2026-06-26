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
  it("shows Hubble's contact details", () => {
    renderFooter()
    expect(screen.getByText(/De Lampendriessen 31-05/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'info@hubble.cafe' })).toHaveAttribute(
      'href',
      'mailto:info@hubble.cafe',
    )
    expect(screen.getByText(/\+31 \(0\)40 247 8507/)).toBeInTheDocument()
  })

  it('notes the UVH conditions', () => {
    renderFooter()
    expect(screen.getByText(/UVH/)).toBeInTheDocument()
  })

  it('links to the privacy statement', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /privacy statement/i })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
