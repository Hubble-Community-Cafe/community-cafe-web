import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { BarStatus } from '@cafe/shared-web'

/**
 * Meteor's open/closed banner. Closed shows a red bar (with the staff message or
 * a default), open shows a green bar only when there's a message to convey.
 * Wired to the live BarStatus in the opening-hours milestone; until then the
 * layout passes a placeholder open status so nothing misleading is shown.
 */
export function StatusBanner({ status }: { status: BarStatus }) {
  const closed = !status.isOpen
  if (!closed && !status.bannerMessage) return null

  const message = status.bannerMessage ?? (closed ? 'Sadly we are closed' : 'We are open')

  return (
    <div
      role="status"
      className={
        closed
          ? 'bg-red-600 text-white'
          : 'bg-meteor-500 text-white'
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-sm font-semibold">
        {closed ? (
          <AlertCircle className="h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  )
}
