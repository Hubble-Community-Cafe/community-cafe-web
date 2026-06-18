import type { BarStatus } from '@cafe/shared-web'

/** Hubble's open/closed banner: shown when closed today or when there is a special notice. */
export function StatusBanner({ status }: { status: BarStatus }) {
  const closed = !status.isOpen
  if (!closed && !status.bannerMessage) return null

  const message = status.bannerMessage ?? (closed ? 'Sadly we are closed today' : 'We are open')

  return (
    <div role="status" className={closed ? 'bg-hubble-700 text-white' : 'bg-hubble-100 text-hubble-800'}>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-sm font-semibold">
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${closed ? 'bg-red-400' : 'bg-green-500'}`}
        />
        <span>{message}</span>
      </div>
    </div>
  )
}
