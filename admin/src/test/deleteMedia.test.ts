import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteMedia } from '../lib/api'

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

  it('rejects with a general message when there is no explanation', async () => {
    respondWith(500)
    await expect(deleteMedia(7)).rejects.toThrow('Could not delete the image (500). Please try again.')
  })
})
