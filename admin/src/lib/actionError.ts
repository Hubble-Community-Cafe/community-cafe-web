/**
 * An error whose message is written for staff and may be shown to them as is, such as the
 * backend's "This image is still used by the event 'Pub quiz'". Any other error (a network failure,
 * a bare status code) gets a plain fallback text instead of its technical message.
 *
 * Kept out of lib/api so that tests which replace that module as a whole can still use it.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}

/** The signed-in staff member lacks the access for this. */
export class ForbiddenError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/** The message to show staff for `err`: its own when it is an ActionError, otherwise `fallback`. */
export function messageFor(err: unknown, fallback: string): string {
  return err instanceof ActionError ? err.message : fallback
}
