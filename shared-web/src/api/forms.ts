import { getApiBaseUrl } from './client'

/** A user-displayable error from a form submission (validation, rate limit, etc.). */
export class FormError extends Error {}

const NETWORK_ERROR = 'Could not reach the server. Please check your connection and try again.'

/** The user-facing error for a non-204 answer, preferring the backend's own `message`. */
function errorFor(status: number, body: string): FormError {
  if (status === 429) {
    return new FormError('Too many submissions from this network. Please wait a minute and try again.')
  }
  let message = 'Something went wrong. Please try again.'
  try {
    const data = JSON.parse(body) as { message?: string }
    if (data?.message) message = data.message
  } catch {
    /* keep the default message */
  }
  return new FormError(message)
}

/**
 * POST a public form. Plain fetch (no retry: a form submit must not be replayed). On a
 * non-204 response the backend's `message` is surfaced so the user sees why it was rejected.
 */
async function postForm(path: string, body: BodyInit, headers?: Record<string, string>): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { method: 'POST', body, headers })
  } catch {
    throw new FormError(NETWORK_ERROR)
  }
  if (response.status === 204) return
  throw errorFor(response.status, await response.text().catch(() => ''))
}

/**
 * Where a large upload is: still sending the file (with a percentage when the browser knows
 * the size), or sent and waiting while the server checks it.
 */
export type UploadProgress =
  | { phase: 'uploading'; percent: number | null }
  | { phase: 'processing' }

/**
 * Like {@link postForm}, but reports upload progress. fetch cannot, so this uses
 * XMLHttpRequest. Same error handling, and no retry either.
 */
function postFormWithProgress(
  path: string,
  body: FormData,
  onProgress: (progress: UploadProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}${path}`)
    xhr.upload.onprogress = (e) => {
      onProgress({
        phase: 'uploading',
        percent: e.lengthComputable && e.total > 0 ? Math.min(100, Math.round((e.loaded / e.total) * 100)) : null,
      })
    }
    xhr.upload.onload = () => onProgress({ phase: 'processing' })
    xhr.onload = () => {
      if (xhr.status === 204) resolve()
      else reject(errorFor(xhr.status, xhr.responseText))
    }
    xhr.onerror = () => reject(new FormError(NETWORK_ERROR))
    xhr.ontimeout = xhr.onerror
    xhr.onabort = xhr.onerror
    onProgress({ phase: 'uploading', percent: 0 })
    xhr.send(body)
  })
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

/**
 * Submit the Hubble poster-screen request (multipart: fields + the poster file). Posters can be
 * up to 20 MB and the server checks them before it answers, so pass `onProgress` to show how far
 * along it is.
 */
export function submitScreenForm(
  data: FormData,
  onProgress?: (progress: UploadProgress) => void,
): Promise<void> {
  if (onProgress) return postFormWithProgress('/api/forms/screen', data, onProgress)
  return postForm('/api/forms/screen', data)
}

/**
 * Submit an e-declaration (multipart: fields + the receipt file). Both sites use this; the
 * `bar` field decides which treasurer it reaches. Omitting it routes to Hubble.
 */
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
