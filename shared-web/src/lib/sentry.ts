/**
 * One Sentry setup for the admin and both public sites, so the release name and the noise filters
 * stay identical across them.
 *
 * The filters only drop what our code can never cause: errors thrown by browser extensions (their
 * scripts run in the page, so Sentry catches them as ours). Network failures are deliberately not
 * filtered here: `reportApiFailure` already separates blips from real problems, and an
 * `ignoreErrors` entry such as "Failed to fetch" would also match the cause it attaches.
 */

import type { BrowserOptions, browserTracingIntegration } from '@sentry/browser'

/** Scripts injected by browser extensions, matched against the stack frames' file URLs. */
export const SENTRY_DENY_URLS: (string | RegExp)[] = [
  /^(chrome|chrome-extension|moz-extension|safari-extension|safari-web-extension):\/\//i,
]

/** Messages that only extensions produce, for events that arrive without a usable stack. */
export const SENTRY_IGNORE_ERRORS: (string | RegExp)[] = [
  // Extension messaging APIs (runtime.sendMessage, tabs.sendMessage) failing in Safari and Chrome.
  /Invalid call to runtime\.sendMessage\(\)/,
  /Could not establish connection\. Receiving end does not exist/,
  'Extension context invalidated',
]

/** The release name Sentry uses for events, source maps and CI releases alike. */
export function sentryRelease(project: string, version: string): string {
  return `${project}@${version}`
}

interface SentrySdk {
  init: (options: BrowserOptions) => unknown
  browserTracingIntegration: typeof browserTracingIntegration
}

interface InitSentryOptions {
  /** Sentry project slug, e.g. `community-cafe-public-meteor`. */
  project: string
  /** App version, from the root package.json via the build's `__APP_VERSION__`. */
  version: string
  /** DSN from the runtime config; an unset or unreplaced `__PLACEHOLDER__` leaves Sentry off. */
  dsn: string | undefined
  environment: string
}

/**
 * Start Sentry when a DSN is configured. Takes the app's own SDK (`@sentry/react`) so the client
 * is the one its error boundaries report to.
 *
 * @returns whether Sentry was started
 */
export function initSentry(sdk: SentrySdk, options: InitSentryOptions): boolean {
  const { project, version, dsn, environment } = options
  if (!dsn || dsn.startsWith('__')) {
    return false
  }
  sdk.init({
    dsn,
    environment,
    release: sentryRelease(project, version),
    integrations: [sdk.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    denyUrls: SENTRY_DENY_URLS,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
  })
  return true
}
