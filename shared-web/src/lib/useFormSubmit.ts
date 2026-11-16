import { useState } from 'react'
import { FormError } from '../api/forms'

export type FormStatus = 'idle' | 'sending' | 'sent'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/**
 * The sending side of a public form: the ALTCHA payload, whether it is idle, sending or sent, and
 * the message to show when it fails. Each form keeps its own fields and layout and only says how to
 * send; this replaces the try/catch every form used to repeat.
 */
export function useFormSubmit() {
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  /**
   * Send the form. `check` runs first and may return a message (a missing file, say), in which case
   * nothing is sent. A FormError from the backend is shown as is; anything else gets a generic text.
   */
  const send = async (submit: (altcha: string) => Promise<unknown>, check?: () => string | null) => {
    setError(null)
    const problem = check?.() ?? null
    if (problem) {
      setError(problem)
      return
    }
    setStatus('sending')
    try {
      await submit(altcha ?? '')
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : GENERIC_ERROR)
      setStatus('idle')
    }
  }

  return { setAltcha, status, error, send }
}
