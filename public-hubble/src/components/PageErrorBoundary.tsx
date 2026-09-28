import { Component, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'

/**
 * Catches a page that fails to render, most often a page file that could not be downloaded (a
 * connection drop, or a deploy the chunk reload could not recover from). Shows a short message with
 * a reload button inside the normal header and footer instead of a blank screen, and reports it.
 * The layout keys it on the path, so navigating to another page starts fresh.
 */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="font-title text-2xl font-bold text-hubble-800">This page could not be loaded</h1>
        <p className="mt-3 text-hubble-800/80">Check your connection and try again.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-hubble-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-hubble-600">
          Reload
        </button>
      </div>
    )
  }
}
