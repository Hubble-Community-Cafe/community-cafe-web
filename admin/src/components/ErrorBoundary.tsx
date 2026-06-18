import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches render errors so a single broken page does not blank the whole admin. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin render error:', error, info)
    Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="font-title text-xl font-bold text-slate-800">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">
              Please reload the page. If the problem persists, contact an administrator.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-hubble-600 px-4 py-2 text-sm font-semibold text-white hover:bg-hubble-500"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
