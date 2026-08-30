import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { reportApiFailure, resetBackendProbeCache } from './errorReporting'
import * as Sentry from '@sentry/browser'

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

const captureException = vi.mocked(Sentry.captureException)
const addBreadcrumb = vi.mocked(Sentry.addBreadcrumb)

/** The probe response for a backend that has been up for `uptimeSeconds`. */
const rootResponse = (uptimeSeconds: number) =>
  new Response(
    JSON.stringify({
      service: 'community-cafe-backend',
      status: 'ok',
      startedAt: '2026-08-30T10:00:00Z',
      uptimeSeconds,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )

const networkFailure = () => new ApiError('network', '/api/menu/METEOR', null, 'boom')

/** The capture options of the single reported event. */
const reportedOptions = () => captureException.mock.calls[0][1] as {
  level: string
  tags: Record<string, string | number>
  fingerprint: string[]
  contexts: { api: Record<string, unknown> }
}

describe('reportApiFailure', () => {
  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { API_URL: 'https://api.example.test' }
    globalThis.fetch = vi.fn() as typeof fetch
    resetBackendProbeCache()
  })

  afterEach(() => {
    delete window.__RUNTIME_CONFIG__
    vi.restoreAllMocks()
    vi.mocked(Sentry.captureException).mockReset()
    vi.mocked(Sentry.addBreadcrumb).mockReset()
  })

  it('reports an error when the backend has been up all along', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(rootResponse(9000))

    await reportApiFailure('menu', networkFailure())

    expect(captureException).toHaveBeenCalledTimes(1)
    const options = reportedOptions()
    expect(options.level).toBe('error')
    expect(options.tags).toMatchObject({
      feature: 'menu',
      'api.kind': 'network',
      'api.backend': 'up',
    })
    expect(options.contexts.api).toMatchObject({
      path: '/api/menu/METEOR',
      backendUptimeSeconds: 9000,
    })
    expect(options.fingerprint).toEqual(['api-failure', 'menu', 'network', 'up'])
  })

  it('stays quiet when the backend has only just restarted', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(rootResponse(12))

    await reportApiFailure('menu', networkFailure())

    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('backend restart') }),
    )
  })

  it('stays quiet when the probe hits a 5xx, which is what a deploy looks like', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 502 }))

    await reportApiFailure('menu', networkFailure())

    expect(captureException).not.toHaveBeenCalled()
  })

  it('flags a CORS rejection when only the opaque probe gets through', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      // An opaque (no-cors) response: it resolves, but nothing in it can be read.
      .mockResolvedValueOnce(new Response('', { status: 200 }))

    await reportApiFailure('menu', networkFailure())

    const options = reportedOptions()
    expect(options.level).toBe('error')
    expect(options.tags['api.backend']).toBe('cors_rejected')
  })

  it('warns rather than errors when nothing reaches the backend', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await reportApiFailure('menu', networkFailure())

    const options = reportedOptions()
    expect(options.level).toBe('warning')
    expect(options.tags['api.backend']).toBe('unreachable')
  })

  it('carries the status of a failed HTTP response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(rootResponse(9000))

    await reportApiFailure('menu', new ApiError('http', '/api/menu/METEOR', 503, 'nope'))

    const options = reportedOptions()
    expect(options.tags['api.status']).toBe(503)
    expect(options.contexts.api.status).toBe(503)
  })

  it('skips reporting while the visitor is offline', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    await reportApiFailure('menu', networkFailure())

    expect(captureException).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    onLine.mockRestore()
  })

  it('skips reporting for a hidden tab, where requests are cancelled anyway', async () => {
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden')

    await reportApiFailure('menu', networkFailure())

    expect(captureException).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    visibility.mockRestore()
  })

  it('probes once for several failures in the same page load', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(rootResponse(9000))

    await reportApiFailure('menu', networkFailure())
    await reportApiFailure('opening-hours', networkFailure())

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledTimes(2)
  })

  it('never throws, whatever Sentry does', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(rootResponse(9000))
    captureException.mockImplementationOnce(() => {
      throw new Error('sentry is down')
    })

    await expect(reportApiFailure('menu', networkFailure())).resolves.toBeUndefined()
  })
})
