/**
 * Sentry reporting for failed content fetches on the public sites.
 *
 * A visitor only ever sees "could not load"; the cause is invisible from the outside. This
 * module classifies the failure and, before reporting, probes the backend so an expected blip
 * is not filed as a bug:
 *
 * - backend up and running for a while -> the failure is client-side (a blocking extension, a
 *   DNS filter, a proxy, a rejected origin). This is the case worth an issue, reported as an error.
 * - backend just restarted, or its proxy is answering 5xx -> a deploy or restart window.
 *   Nothing is reported; a breadcrumb records it in case the session hits something else later.
 * - the readable probe fails but an opaque (no-cors) one succeeds -> the request reaches the
 *   server and CORS rejects the read, which is a configuration problem, reported as an error.
 * - neither probe gets through -> unreachable, reported as a warning: could be the network, an
 *   extension, or a deploy that has not finished yet.
 *
 * Only non-identifying context is attached: no IP, no user agent beyond what Sentry already
 * collects, no page content, nothing typed by the visitor.
 */

import * as Sentry from '@sentry/browser'
import { ApiError, getApiBaseUrl } from './client'

/**
 * Backend uptime below this counts as "just restarted", so a failure in that window is treated
 * as deploy noise rather than a bug. Roughly covers a container restart plus its warmup.
 */
const DEPLOY_GRACE_SECONDS = 180

/** Probes must not hang: a stalled probe would delay nothing visible, but it would leak timers. */
const PROBE_TIMEOUT_MS = 3000

/** One probe result is reused for this long, so a page with several failing fetches probes once. */
const PROBE_CACHE_MS = 30_000

/** What the liveness probe concluded about the backend. */
export type BackendOutcome = 'up' | 'restarting' | 'cors_rejected' | 'unreachable'

export interface BackendProbe {
  outcome: BackendOutcome
  /** Seconds since the backend started, when it reported them. */
  uptimeSeconds: number | null
  /** HTTP status of the probe, when there was a response to read one from. */
  status: number | null
}

let cachedProbe: { at: number; probe: Promise<BackendProbe> } | null = null

/** Test seam: forget the cached probe so each case starts from a clean slate. */
export function resetBackendProbeCache(): void {
  cachedProbe = null
}

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

async function runProbe(): Promise<BackendProbe> {
  let base: string
  try {
    base = getApiBaseUrl()
  } catch {
    return { outcome: 'unreachable', uptimeSeconds: null, status: null }
  }
  const url = `${base}/`

  try {
    const response = await fetchWithTimeout(url, { cache: 'no-store' })
    if (response.ok) {
      const body = (await response.json()) as { uptimeSeconds?: unknown }
      const uptimeSeconds = typeof body.uptimeSeconds === 'number' ? body.uptimeSeconds : null
      const restarting = uptimeSeconds !== null && uptimeSeconds <= DEPLOY_GRACE_SECONDS
      return {
        outcome: restarting ? 'restarting' : 'up',
        uptimeSeconds,
        status: response.status,
      }
    }
    // A live proxy in front of a dead app: exactly what a deploy looks like from here.
    if (response.status >= 500) {
      return { outcome: 'restarting', uptimeSeconds: null, status: response.status }
    }
    // Any other status still proves the server answered and the read was allowed.
    return { outcome: 'up', uptimeSeconds: null, status: response.status }
  } catch {
    // The readable probe never produced a response. An opaque request separates "CORS refused
    // to hand us the answer" from "the request never arrived".
    try {
      await fetchWithTimeout(url, { mode: 'no-cors', cache: 'no-store' })
      return { outcome: 'cors_rejected', uptimeSeconds: null, status: null }
    } catch {
      return { outcome: 'unreachable', uptimeSeconds: null, status: null }
    }
  }
}

/** Probe the backend, reusing a recent result so a burst of failures costs one round trip. */
export function probeBackend(): Promise<BackendProbe> {
  const now = Date.now()
  if (cachedProbe && now - cachedProbe.at < PROBE_CACHE_MS) {
    return cachedProbe.probe
  }
  const probe = runProbe()
  cachedProbe = { at: now, probe }
  return probe
}

function describeFailure(error: unknown): {
  kind: ApiError['kind'] | 'unknown'
  path: string | null
  status: number | null
} {
  if (error instanceof ApiError) {
    return { kind: error.kind, path: error.path, status: error.status }
  }
  return { kind: 'unknown', path: null, status: null }
}

/** Round-trip class of the connection, when the browser exposes it. Coarse and non-identifying. */
function connectionType(): string | null {
  const connection = (navigator as { connection?: { effectiveType?: string } }).connection
  return connection?.effectiveType ?? null
}

const LEVEL_BY_OUTCOME: Record<BackendOutcome, Sentry.SeverityLevel> = {
  up: 'error',
  restarting: 'info',
  cors_rejected: 'error',
  unreachable: 'warning',
}

/**
 * Report a failed content fetch to Sentry, unless it is the kind of failure that says nothing:
 * the visitor is offline, the tab was backgrounded (browsers cancel in-flight requests), or the
 * backend is mid-restart.
 *
 * Fire-and-forget: it never throws and never blocks rendering the error state.
 *
 * @param feature Short name of what failed to load, e.g. `menu`. Becomes the Sentry tag.
 */
export async function reportApiFailure(feature: string, error: unknown): Promise<void> {
  try {
    const { kind, path, status } = describeFailure(error)

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      Sentry.addBreadcrumb({
        category: 'api',
        level: 'info',
        message: `${feature} fetch failed while offline`,
        data: { kind, path },
      })
      return
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      // The tab was hidden or being navigated away from, which cancels requests. Indistinguishable
      // from a blocked request, and never actionable.
      Sentry.addBreadcrumb({
        category: 'api',
        level: 'info',
        message: `${feature} fetch failed in a hidden tab`,
        data: { kind, path },
      })
      return
    }

    const probe = await probeBackend()

    if (probe.outcome === 'restarting') {
      Sentry.addBreadcrumb({
        category: 'api',
        level: 'info',
        message: `${feature} fetch failed during a backend restart`,
        data: { kind, path, status, uptimeSeconds: probe.uptimeSeconds },
      })
      return
    }

    Sentry.captureException(error, {
      level: LEVEL_BY_OUTCOME[probe.outcome],
      tags: {
        feature,
        'api.kind': kind,
        'api.status': status ?? 'none',
        'api.backend': probe.outcome,
      },
      contexts: {
        api: {
          feature,
          path,
          kind,
          status,
          backendOutcome: probe.outcome,
          backendUptimeSeconds: probe.uptimeSeconds,
          backendProbeStatus: probe.status,
          connectionType: connectionType(),
        },
      },
      // Group by what went wrong rather than by stack: every one of these shares a stack.
      fingerprint: ['api-failure', feature, kind, probe.outcome],
    })
  } catch {
    // Reporting must never be the reason a page breaks.
  }
}
