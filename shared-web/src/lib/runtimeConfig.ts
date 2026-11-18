// Runtime configuration injected at container startup (see each app's public/config.js and the
// Docker entrypoint), so one image runs in every environment without a rebuild. Until the
// entrypoint substitutes them, values are placeholders like `__API_URL__`; in local dev they stay so.
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_URL?: string
      SENTRY_DSN?: string
      [key: string]: string | undefined
    }
  }
}

/**
 * A runtime config value, or undefined when it is missing, blank or still a placeholder. Every
 * reader goes through this, so they all agree on what "not set" means and fall back to their
 * build-time `VITE_*` value the same way: `runtimeConfig('API_URL') ?? import.meta.env.VITE_API_URL`.
 */
export function runtimeConfig(key: string): string | undefined {
  const value = window.__RUNTIME_CONFIG__?.[key]?.trim()
  if (!value || value.startsWith('__')) return undefined
  return value
}
