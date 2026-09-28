import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { UnsavedChangesContext } from '../lib/unsavedChanges'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Guards every form on the page (see useUnsavedChangesGuard). While any form holds unsaved input:
 * moving to another page (sidebar, links, browser back or forward) first asks to discard it, and
 * closing or reloading the tab shows the browser's own "leave site?" warning. Needs a data router
 * (main.tsx) for useBlocker.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyForms, setDirtyForms] = useState<ReadonlySet<string>>(new Set())
  const isDirty = dirtyForms.size > 0

  const setDirty = useCallback((formId: string, dirty: boolean) => {
    setDirtyForms((current) => {
      if (current.has(formId) === dirty) return current
      const next = new Set(current)
      if (dirty) next.add(formId)
      else next.delete(formId)
      return next
    })
  }, [])
  const registry = useMemo(() => ({ setDirty }), [setDirty])

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = '' // older browsers only prompt when this is set
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const keepEditing = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  return (
    <UnsavedChangesContext.Provider value={registry}>
      {children}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        message="You have changes that are not saved yet. If you leave this page, they are lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={keepEditing}
      />
    </UnsavedChangesContext.Provider>
  )
}
