import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { BarStatus } from '@cafe/shared-web'
import { StatusBanner } from '../components/StatusBanner'

const base: BarStatus = { bar: 'METEOR', isOpen: true, bannerMessage: null }

describe('StatusBanner', () => {
  it('renders nothing when open with no message', () => {
    const { container } = render(<StatusBanner status={base} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a closed banner with the default message', () => {
    render(<StatusBanner status={{ ...base, isOpen: false }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Sadly we are closed')
  })

  it('prefers the staff-provided banner message', () => {
    render(
      <StatusBanner status={{ ...base, isOpen: false, bannerMessage: 'Closed for a private event' }} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Closed for a private event')
  })

  it('shows an open banner only when there is a message', () => {
    render(<StatusBanner status={{ ...base, isOpen: true, bannerMessage: 'Open late tonight' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Open late tonight')
  })
})
