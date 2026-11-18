import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { messageFor } from '../lib/actionError'
import { ConfirmActionContext, type ConfirmAction, type ConfirmActionOptions } from '../lib/confirmAction'

const FALLBACK_ERROR = 'That did not work. Please check your connection and try again.'

/**
 * One confirmation dialog for every destructive action in the admin (see useConfirmAction). Staff
 * see what will happen, the action runs while the dialog shows it is busy, and a failure stays on
 * screen with its reason and a Try again button instead of disappearing silently.
 */
export function ConfirmActionProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ConfirmActionOptions | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const settle = useRef<(done: boolean) => void>(() => {})

  const confirmAction = useCallback<ConfirmAction>((options) => {
    setCurrent(options)
    setBusy(false)
    setError(null)
    return new Promise<boolean>((resolve) => { settle.current = resolve })
  }, [])

  const close = useCallback((done: boolean) => {
    setCurrent(null)
    setBusy(false)
    setError(null)
    settle.current(done)
  }, [])

  const onConfirm = async () => {
    if (!current) return
    setBusy(true)
    setError(null)
    try {
      await current.action()
      close(true)
    } catch (err) {
      setError(messageFor(err, FALLBACK_ERROR))
      setBusy(false)
    }
  }

  const onCancel = useCallback(() => close(false), [close])

  return (
    <ConfirmActionContext.Provider value={confirmAction}>
      {children}
      <ConfirmDialog
        open={current !== null}
        title={current?.title ?? ''}
        message={current?.message ?? ''}
        confirmLabel={error ? 'Try again' : current?.confirmLabel ?? ''}
        busyLabel={current?.busyLabel ?? 'Deleting…'}
        cancelLabel="Cancel"
        busy={busy}
        error={error}
        onConfirm={() => void onConfirm()}
        onCancel={onCancel}
      />
    </ConfirmActionContext.Provider>
  )
}
