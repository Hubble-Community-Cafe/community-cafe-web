import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as Sentry from '@sentry/react'
import { PageErrorBoundary } from '../components/PageErrorBoundary'

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

function BrokenPage(): never {
  // What React.lazy throws when a page file cannot be downloaded.
  throw new TypeError('Failed to fetch dynamically imported module')
}

describe('PageErrorBoundary', () => {
  const reload = vi.fn()
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React logs the caught error
    vi.stubGlobal('location', { ...window.location, reload })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the page when nothing goes wrong', () => {
    render(<PageErrorBoundary><p>Page content</p></PageErrorBoundary>)
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('shows a message with a reload button instead of a blank page, and reports it', async () => {
    render(<PageErrorBoundary><BrokenPage /></PageErrorBoundary>)

    expect(screen.getByRole('alert')).toHaveTextContent('This page could not be loaded')
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(TypeError))

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reload' }))
    expect(reload).toHaveBeenCalled()
  })
})
