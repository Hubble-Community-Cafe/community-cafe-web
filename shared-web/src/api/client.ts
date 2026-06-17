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

/** GET a path under the API base and parse the JSON body. */
export async function getJson<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`
  const response = await fetchWithRetry(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`)
  }
  return response.json() as Promise<T>
}
