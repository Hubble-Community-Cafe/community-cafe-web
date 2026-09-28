import { useEffect, useId, useRef } from 'react'

/**
 * A yes/no question in a modal alert dialog. Focus starts on the safe choice (cancel), Escape
 * cancels, and focus goes back where it was when the dialog closes.
 */
export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
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
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
