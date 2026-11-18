import { useState } from 'react'
import { Loader2, WifiOff } from 'lucide-react'

/**
 * Shown when the staff member's own record (their access) could not be loaded. Without it the
 * admin treated the failure as "no access" and told them to ask an admin, which is wrong and
 * alarming for what is usually a dropped connection or a server restart.
 */
export function AccessLoadFailed({ onRetry }: { onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div role="alert" className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
          <WifiOff className="h-7 w-7" />
        </span>
        <h1 className="font-title text-xl font-bold text-slate-800">We couldn&rsquo;t load your access</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your access has not changed: the admin just could not reach the server. Check your internet
          connection and try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-hubble-700 px-4 py-2 text-sm font-semibold text-white hover:bg-hubble-800 disabled:opacity-60"
        >
          {retrying && <Loader2 className="h-4 w-4 animate-spin" />}
          {retrying ? 'Trying again…' : 'Try again'}
        </button>
      </div>
    </div>
  )
}
