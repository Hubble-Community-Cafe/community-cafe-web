import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent, reorderVacancies } from '../lib/api'
import { ActionError, messageFor } from '../lib/actionError'

const respondWith = (status: number, body?: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  }))

const event = { bar: 'HUBBLE', title: 'Quiz', date: '2030-01-10', startTime: null, price: null,
  description: null, subscribeLink: 'www.example.com', imageId: null, published: true } as const

/**
 * A save the backend refused used to throw "Request failed (400) for /api/…", and every form then
 * showed its own "Failed to save". Staff never learned what to fix.
 */
describe('a save the backend refuses', () => {
  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'test-oid' }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })

  it("carries the backend's reason, for the form to show", async () => {
    respondWith(400, { message: 'Sign-up link must start with https:// or http://' })
    const failure = await createEvent(event).catch((e: unknown) => e)

    expect(failure).toBeInstanceOf(ActionError)
    expect(messageFor(failure, 'Failed to save event')).toBe('Sign-up link must start with https:// or http://')
  })

  it('carries it for writes without a response body too', async () => {
    respondWith(409, { message: 'Someone else changed this list. Reload the page.' })
    await expect(reorderVacancies([3, 1, 2])).rejects.toThrow('Someone else changed this list. Reload the page.')
  })

  it('keeps a server error technical, so the form shows its own plain text', async () => {
    respondWith(500, { message: 'could not execute statement; SQL [n/a]' })
    const failure = await createEvent(event).catch((e: unknown) => e)

    expect(failure).not.toBeInstanceOf(ActionError)
    expect(messageFor(failure, 'Failed to save event')).toBe('Failed to save event')
  })

  it('copes with an answer that has no message at all', async () => {
    respondWith(400)
    const failure = await createEvent(event).catch((e: unknown) => e)

    expect(messageFor(failure, 'Failed to save event')).toBe('Failed to save event')
  })
})
