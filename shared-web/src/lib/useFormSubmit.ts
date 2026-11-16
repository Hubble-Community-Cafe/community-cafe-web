import { useId, useRef, useState, type FormEvent } from 'react'
import { FormError } from '../api/forms'

export type FormStatus = 'idle' | 'sending' | 'sent'

/** What a form's own check found: a message, optionally about one field (by its name). */
export type FormProblem = string | { message: string; field: string }

/** Spread on a field: its name, and whether it is marked wrong (pointing to the error message). */
export interface FieldProps {
  name: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/** "Email address *" or "Colour (optional hex)" as the words a message can name: "Email address". */
function labelOf(field: Field): string {
  const text = field.labels?.[0]?.textContent ?? field.name
  return text.replace(/\(.*?\)/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * The fields the browser already knows are wrong (required and empty, or not an e-mail address),
 * with one message naming them all. The forms turn off the browser's own bubbles (noValidate), so
 * this is where those checks surface.
 */
function browserProblems(form: HTMLFormElement): { message: string; fields: string[] } | null {
  const wrong = Array.from(form.elements).filter((el): el is Field =>
    (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)
    && !!el.name && el.willValidate && !el.validity.valid)
  if (wrong.length === 0) return null
  const missing = wrong.filter((el) => el.validity.valueMissing).map(labelOf)
  const malformed = wrong.filter((el) => !el.validity.valueMissing).map(labelOf)
  const message = [
    missing.length > 0 ? `Please fill in: ${missing.join(', ')}.` : '',
    malformed.length > 0 ? `Please check: ${malformed.join(', ')}.` : '',
  ].filter(Boolean).join(' ')
  return { message, fields: wrong.map((el) => el.name) }
}

/**
 * The sending side of a public form: the ALTCHA payload, whether it is idle, sending or sent, and
 * the message to show when it fails. Each form keeps its own fields and layout and only says how to
 * send; this replaces the try/catch every form used to repeat.
 *
 * It also marks the fields a failure is about, for screen readers (aria-invalid, pointing to the
 * message) and the eye (each site styles `aria-[invalid=true]`). Spread `formProps` on the form,
 * `fieldProps(name)` on each field (the name it is posted under), and put `errorId` on the message.
 */
export function useFormSubmit() {
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const errorId = useId()

  const fail = (message: string, fields: string[] = []) => {
    setError(message)
    setInvalid(fields)
    const first = fields.length > 0 ? formRef.current?.elements.namedItem(fields[0]) : null
    if (first instanceof HTMLElement) first.focus()
  }

  /**
   * Send the form. Fields the browser finds wrong stop it first, then `check` may return a problem
   * (a missing file, say); either way nothing is sent. A FormError from the backend is shown as is,
   * marking its field; anything else gets a generic text.
   */
  const send = async (submit: (altcha: string) => Promise<unknown>, check?: () => FormProblem | null) => {
    setError(null)
    setInvalid([])
    const fromBrowser = formRef.current ? browserProblems(formRef.current) : null
    if (fromBrowser) {
      fail(fromBrowser.message, fromBrowser.fields)
      return
    }
    const problem = check?.() ?? null
    if (problem) {
      if (typeof problem === 'string') fail(problem)
      else fail(problem.message, [problem.field])
      return
    }
    setStatus('sending')
    try {
      await submit(altcha ?? '')
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      if (err instanceof FormError) fail(err.message, err.field ? [err.field] : [])
      else fail(GENERIC_ERROR)
    }
  }

  /** A field stops being marked as soon as it is changed. */
  const onInput = (e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as Partial<Field>).name
    if (name) setInvalid((fields) => (fields.includes(name) ? fields.filter((f) => f !== name) : fields))
  }

  const fieldProps = (name: string): FieldProps => invalid.includes(name)
    ? { name, 'aria-invalid': true, 'aria-describedby': errorId }
    : { name }

  const formProps = { ref: formRef, noValidate: true, onInput }

  return { setAltcha, status, error, errorId, send, fieldProps, formProps }
}
