import { createContext, useContext, useEffect, useId, useState } from 'react'

/**
 * Registry of forms that hold unsaved input. One UnsavedChangesProvider (in Layout) owns the only
 * navigation blocker, the tab-close warning and the confirm dialog, because React Router supports a
 * single blocker at a time and several forms can be open at once (a board term and a member).
 */
export interface UnsavedChangesRegistry {
  setDirty: (formId: string, dirty: boolean) => void
}

export const UnsavedChangesContext = createContext<UnsavedChangesRegistry | null>(null)

/**
 * Report whether this form holds unsaved input. While any form does, leaving the page asks
 * "Discard unsaved changes?" and closing the tab shows the browser's own warning. Outside the
 * provider (a page rendered on its own in a test) it does nothing.
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  const registry = useContext(UnsavedChangesContext)
  const formId = useId()
  useEffect(() => {
    if (!registry) return
    registry.setDirty(formId, isDirty)
    return () => registry.setDirty(formId, false)
  }, [registry, formId, isDirty])
}

/**
 * Whether `values` differ from what they were when the form opened (its first render), so merely
 * opening a form never counts as a change. Pass the form's editable fields.
 */
export function useChangedSince(values: unknown): boolean {
  const serialized = JSON.stringify(values)
  const [initial] = useState(serialized)
  return serialized !== initial
}
