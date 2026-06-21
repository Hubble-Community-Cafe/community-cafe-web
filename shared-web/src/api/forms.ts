import { getApiBaseUrl } from './client'

/** A user-displayable error from a form submission (validation, rate limit, etc.). */
export class FormError extends Error {}

/**
 * POST a public form. Plain fetch (no retry: a form submit must not be replayed). On a
 * non-204 response the backend's `message` is surfaced so the user sees why it was rejected.
 */
async function postForm(path: string, body: BodyInit, headers?: Record<string, string>): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { method: 'POST', body, headers })
  } catch {
    throw new FormError('Could not reach the server. Please check your connection and try again.')
  }
  if (response.status === 204) return
  if (response.status === 429) {
    throw new FormError('Too many submissions from this network. Please wait a minute and try again.')
  }
  let message = 'Something went wrong. Please try again.'
  try {
    const data = (await response.json()) as { message?: string }
    if (data?.message) message = data.message
  } catch {
    /* keep the default message */
  }
  throw new FormError(message)
}

export type ComplaintType = 'TIP' | 'COMPLAINT' | 'IDEA'

export interface ComplaintInput {
  name: string
  email: string
  phone?: string
  date?: string
  type: ComplaintType
  message: string
  /** Honeypot: leave empty; a value marks the sender as a bot. */
  honeypot?: string
  /** ALTCHA proof-of-work payload (base64). */
  altcha?: string
}

/**
 * The backend endpoint the ALTCHA widget fetches a challenge from. Resolved at render time,
 * so it must never throw: if the API base URL isn't configured (e.g. a preview without a
 * backend), fall back to a same-origin relative path rather than crashing the form.
 */
export function formsChallengeUrl(): string {
  try {
    return `${getApiBaseUrl()}/api/forms/challenge`
  } catch {
    return '/api/forms/challenge'
  }
}

export function submitComplaint(input: ComplaintInput): Promise<void> {
  return postForm('/api/forms/complaint', JSON.stringify(input), {
    'Content-Type': 'application/json',
  })
}

/** Submit the Hubble poster-screen request (multipart: fields + the poster file). */
export function submitScreenForm(data: FormData): Promise<void> {
  return postForm('/api/forms/screen', data)
}

/** Submit the Hubble e-declaration (multipart: fields + the receipt file). */
export function submitDeclarationForm(data: FormData): Promise<void> {
  return postForm('/api/forms/declaration', data)
}

export interface TipInput {
  name: string
  email: string
  phone?: string
  date?: string
  type: ComplaintType
  message: string
  /** Whether the submitter wants updates on this subject. */
  wantsUpdates: boolean
  honeypot?: string
  altcha?: string
}

/** Submit the Hubble "Tips, Complaints & Ideas" form (JSON). */
export function submitTip(input: TipInput): Promise<void> {
  return postForm('/api/forms/tips', JSON.stringify(input), {
    'Content-Type': 'application/json',
  })
}

export interface InformationInput {
  name: string
  email: string
  phone?: string
  message: string
  honeypot?: string
  altcha?: string
}

/** Submit the Hubble "Information form" (JSON). */
export function submitInformation(input: InformationInput): Promise<void> {
  return postForm('/api/forms/information', JSON.stringify(input), {
    'Content-Type': 'application/json',
  })
}

export interface LoanInput {
  name: string
  association: string
  email: string
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
  message: string
  honeypot?: string
  altcha?: string
}

/** Submit the Hubble "Loan Equipment" request (JSON). */
export function submitLoan(input: LoanInput): Promise<void> {
  return postForm('/api/forms/loan', JSON.stringify(input), {
    'Content-Type': 'application/json',
  })
}
