import { useEffect, useId, useRef } from 'react'

/**
 * A yes/no question in a modal alert dialog. Focus starts on the safe choice (cancel), Escape
 * cancels, and focus goes back where it was when the dialog closes.
 */
export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, busyLabel, busy = false, error = null,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Shown on the confirm button while `busy`, e.g. "Deleting…". */
  busyLabel?: string
  /** The confirmed action is running: both buttons wait and Escape does nothing. */
  busy?: boolean
  /** Why the confirmed action failed, shown above the buttons so it can be retried or cancelled. */
  error?: string | null
}) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  // Read by the Escape handler, which is set up once per opening rather than on every busy change.
  const busyRef = useRef(busy)
  useEffect(() => { busyRef.current = busy }, [busy])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busyRef.current) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id={titleId} className="font-title text-lg font-bold text-slate-900">{title}</h2>
        <p id={messageId} className="mt-2 text-sm text-slate-700">{message}</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
