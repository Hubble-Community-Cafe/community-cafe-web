import type { BarStatus } from '@cafe/shared-web'

/**
 * Meteor's open/closed banner, matching the live site's thin top strip: a deep
 * green bar with a red dot for "closed", a gold bar for an "open" notice.
 * Wired to the live BarStatus in the opening-hours milestone; until then the
 * layout passes a placeholder open status so nothing misleading is shown.
 */
export function StatusBanner({ status }: { status: BarStatus }) {
  const closed = !status.isOpen
  if (!closed && !status.bannerMessage) return null

  const message = status.bannerMessage ?? (closed ? 'Sadly we are closed' : 'We are open')

  return (
    <div role="status" className={closed ? 'bg-meteor-500 text-white' : 'bg-meteor-accent text-meteor-950'}>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${closed ? 'bg-red-500' : 'bg-meteor-700'}`}
        />
        <span>{message}</span>
      </div>
    </div>
  )
}
