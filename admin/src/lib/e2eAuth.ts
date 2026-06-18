/**
 * End-to-end test authentication bridge.
 *
 * The admin normally authenticates with Microsoft (MSAL) and sends a Bearer
 * token, which cannot be driven headlessly. The e2e stack injects an
 * {@code E2E_AUTH_OID} runtime value; when present, the app skips MSAL and sends
 * {@code X-Test-*} headers that the backend's e2e security chain understands.
 *
 * Inert in dev and production: that value is only ever set by the e2e stack.
 */

function clean(value: string | undefined): string | undefined {
  if (!value || value.startsWith('__') || value.trim() === '') return undefined
  return value
}

export interface E2eAuth {
  oid: string
  email?: string
  name?: string
}

/** The injected e2e identity, or null when not running under the e2e stack. */
export function getE2eAuth(): E2eAuth | null {
  const cfg = window.__RUNTIME_CONFIG__
  const oid = clean(cfg?.E2E_AUTH_OID)
  if (!oid) return null
  return { oid, email: clean(cfg?.E2E_AUTH_EMAIL), name: clean(cfg?.E2E_AUTH_NAME) }
}

/** True only when the app is running under the e2e test stack. */
export function isE2E(): boolean {
  return getE2eAuth() !== null
}
