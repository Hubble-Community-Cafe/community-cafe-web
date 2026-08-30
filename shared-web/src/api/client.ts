/**
 * Shared API client: runtime-config resolution + retrying fetch.
 *
 * Mirrors the Harry List pattern. The base URL comes from runtime config
 * (`window.__RUNTIME_CONFIG__`, injected per container at startup) and falls
 * back to a build-time Vite env var, so the same image runs in every
 * environment without a rebuild.
 */

// Runtime configuration injected at container startup (see each app's config.js
// and the Docker entrypoint). Values are placeholders like `__API_URL__` until
// substituted, so callers must ignore anything still wrapped in underscores.
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_URL?: string
      SENTRY_DSN?: string
      [key: string]: string | undefined
    }
  }
}

const isPlaceholder = (value: string | undefined): value is undefined =>
  !value || value.startsWith('__')

/**
 * Resolve the backend base URL. Prefers runtime config, then the build-time
 * `VITE_PUBLIC_API_URL` (public sites) or `VITE_API_URL` (admin).
 */
export function getApiBaseUrl(): string {
  const runtimeUrl = window.__RUNTIME_CONFIG__?.API_URL
  if (!isPlaceholder(runtimeUrl)) {
    return runtimeUrl
  }
  const envUrl =
    import.meta.env.VITE_PUBLIC_API_URL ?? import.meta.env.VITE_API_URL
  if (!envUrl) {
    throw new Error(
      'API base URL is not configured. Set VITE_PUBLIC_API_URL (or VITE_API_URL) in .env, or inject API_URL via runtime config.',
    )
  }
  return envUrl
}

/**
 * Why an API call failed. The four cases are indistinguishable on screen (every one of them
 * ends as "could not load"), but they point at completely different culprits: `network` at a
 * blocked, filtered or unreachable request, `http` at the backend or its proxy, `parse` at a
 * truncated or intercepted response, `config` at a broken deploy.
 */
export type ApiFailureKind = 'network' | 'http' | 'parse' | 'config'

/** An API call that failed, carrying enough context to triage it in Sentry. */
export class ApiError extends Error {
  readonly kind: ApiFailureKind
  readonly path: string
  readonly status: number | null

  constructor(
    kind: ApiFailureKind,
    path: string,
    status: number | null,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'ApiError'
    this.kind = kind
    this.path = path
    this.status = status
  }
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

/**
 * Fetch with bounded retry on transient failures (network error or a retryable
 * status). Backs off linearly: 1s, 2s, ... between attempts.
 */
export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(input, init)
      if (
        response.ok ||
        attempt === maxAttempts ||
        !RETRYABLE_STATUS_CODES.has(response.status)
      ) {
        return response
      }
    } catch (error) {
      if (attempt === maxAttempts) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }
  // Unreachable, but satisfies the type checker.
  throw new Error(`Failed to fetch ${input} after ${maxAttempts} attempts`)
}

/**
 * GET a path under the API base and parse the JSON body. Every failure surfaces as an
 * {@link ApiError} so callers can report *why* a page could not load, not just that it did not.
 */
export async function getJson<T>(path: string): Promise<T> {
  let url: string
  try {
    url = `${getApiBaseUrl()}${path}`
  } catch (error) {
    throw new ApiError('config', path, null, `API base URL is not configured for ${path}`, {
      cause: error,
    })
  }

  let response: Response
  try {
    response = await fetchWithRetry(url)
  } catch (error) {
    throw new ApiError('network', path, null, `Request failed to reach the API for ${path}`, {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new ApiError('http', path, response.status, `Request failed (${response.status}) for ${path}`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new ApiError('parse', path, response.status, `Response was not valid JSON for ${path}`, {
      cause: error,
    })
  }
}
