import { describe, expect, it, vi } from 'vitest'
import { eventFiltersIntegration } from '@sentry/browser'
import type { Event } from '@sentry/browser'
import { initSentry, sentryRelease, SENTRY_DENY_URLS, SENTRY_IGNORE_ERRORS } from './sentry'

function fakeSdk() {
  return { init: vi.fn(), browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })) }
}

const base = { project: 'community-cafe-public-meteor', version: '1.4.5', environment: 'production' }

/** Run an event through Sentry's own inbound filter with our lists, as the SDK does before sending. */
function isDropped(event: Event): boolean {
  const filter = eventFiltersIntegration({ denyUrls: SENTRY_DENY_URLS, ignoreErrors: SENTRY_IGNORE_ERRORS })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (filter as any).processEvent(event, {}, { getOptions: () => ({}) }) === null
}

function errorEvent(value: string, filename = 'https://meteor.cafe/assets/index-abc.js'): Event {
  return {
    exception: {
      values: [{ type: 'Error', value, stacktrace: { frames: [{ filename, function: 'f' }] } }],
    },
  }
}

describe('sentryRelease', () => {
  it('prefixes the version with the project slug', () => {
    expect(sentryRelease('community-cafe-admin', '1.4.5')).toBe('community-cafe-admin@1.4.5')
  })
})

describe('initSentry', () => {
  it('starts Sentry with the release, environment and filters', () => {
    const sdk = fakeSdk()

    expect(initSentry(sdk, { ...base, dsn: 'https://key@sentry.example/1' })).toBe(true)
    expect(sdk.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.example/1',
        environment: 'production',
        release: 'community-cafe-public-meteor@1.4.5',
        denyUrls: SENTRY_DENY_URLS,
        ignoreErrors: SENTRY_IGNORE_ERRORS,
      }),
    )
  })

  it.each([undefined, '', '__SENTRY_DSN__'])('stays off when the DSN is %j', (dsn) => {
    const sdk = fakeSdk()

    expect(initSentry(sdk, { ...base, dsn })).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
  })
})

describe('noise filters', () => {
  it('drops the Safari extension messaging error', () => {
    expect(isDropped(errorEvent('Invalid call to runtime.sendMessage(). Tab not found.'))).toBe(true)
  })

  it('drops the Chrome extension messaging error', () => {
    expect(
      isDropped(errorEvent('Could not establish connection. Receiving end does not exist.')),
    ).toBe(true)
  })

  it.each([
    'safari-web-extension://ABC/content.js',
    'chrome-extension://abc/inject.js',
    'moz-extension://abc/content.js',
  ])('drops errors thrown from %s', (filename) => {
    expect(isDropped(errorEvent('Something broke', filename))).toBe(true)
  })

  it('keeps errors from our own bundle', () => {
    expect(isDropped(errorEvent('Cannot read properties of undefined'))).toBe(false)
  })

  it('keeps API failures whose cause is a browser network error', () => {
    const event: Event = {
      exception: {
        values: [
          { type: 'TypeError', value: 'Failed to fetch' },
          { type: 'ApiError', value: 'Request failed to reach the API for /api/menu' },
        ],
      },
    }
    expect(isDropped(event)).toBe(false)
  })
})
