import { createContext, useContext } from 'react'

export interface ConfirmActionOptions {
  /** The question, e.g. "Delete this event?" */
  title: string
  /** What will happen, in plain words, e.g. "Quiz night disappears from the website." */
  message: string
  /** The confirm button, e.g. "Delete event". */
  confirmLabel: string
  /** Shown on the confirm button while the action runs. Defaults to "Deleting…". */
  busyLabel?: string
  /** The action to run once confirmed. Throwing keeps the dialog open with the reason. */
  action: () => Promise<void>
}

export type ConfirmAction = (options: ConfirmActionOptions) => Promise<boolean>

export const ConfirmActionContext = createContext<ConfirmAction | null>(null)

/**
 * Ask before a destructive action and run it (ConfirmActionProvider, in Layout, shows the dialog).
 * Resolves true once the action succeeded, false when the staff member cancelled.
 */
export function useConfirmAction(): ConfirmAction {
  const confirmAction = useContext(ConfirmActionContext)
  if (!confirmAction) throw new Error('useConfirmAction needs a ConfirmActionProvider (it is in Layout)')
  return confirmAction
}
