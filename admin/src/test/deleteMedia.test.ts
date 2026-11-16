import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteEvent, deleteMedia } from '../lib/api'
import { ActionError } from '../lib/actionError'

/**
 * deleteMedia must reject when the backend refuses, so the page does not drop an image from the
 * library that was never deleted. Runs through the e2e auth bridge, like uploadMedia's test.
 */
describe('deleteMedia', () => {
  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'test-oid' }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })

  const respondWith = (status: number, body?: unknown) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: status < 300,
      status,
      json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
    }))
  }

  it('resolves when the image was deleted', async () => {
    respondWith(204)
    await expect(deleteMedia(7)).resolves.toBeUndefined()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining('/api/admin/media/7'),
      expect.objectContaining({ method: 'DELETE' }))
  })

  it("rejects with the backend's explanation when the image is still in use", async () => {
    respondWith(409, { message: "This image is still used by the event 'Pub quiz'. Choose another image there first." })
    await expect(deleteMedia(7)).rejects.toThrow("This image is still used by the event 'Pub quiz'.")
  })

  it('rejects with a plain message, without the status code, when there is no explanation', async () => {
    respondWith(500)
    await expect(deleteMedia(7)).rejects.toThrow('Could not delete the image. Please try again.')
  })

  /** Every admin delete goes through the same helper (deleteResource), so this covers them all. */
  it('rejects with an ActionError, whose message the confirmation dialog shows to staff', async () => {
    respondWith(500)
    await expect(deleteMedia(7)).rejects.toBeInstanceOf(ActionError)
  })

  it('treats an image that is already gone (404) as deleted, so it leaves the library', async () => {
    respondWith(404)
    await expect(deleteMedia(7)).resolves.toBeUndefined()
  })
})

describe('the other deletes', () => {
  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'test-oid' }
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })

  /** They used to resolve whatever the backend answered, so a failed delete removed the row anyway. */
  it('reject when the backend fails instead of pretending the delete worked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }))
    await expect(deleteEvent(3)).rejects.toThrow('Could not delete the event. Please try again.')
  })
})
