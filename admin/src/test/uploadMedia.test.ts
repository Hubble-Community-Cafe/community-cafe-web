import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadMedia } from '../lib/api'

/**
 * uploadMedia turns a failed response into the message the admin shows the user. Signing in with
 * MSAL is not drivable here, so these run through the e2e auth bridge instead.
 */
describe('uploadMedia error messages', () => {
  const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })

  beforeEach(() => {
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'test-oid' }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })

  const respondWith = (status: number, body: unknown) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
    }))
  }

  it("passes through the backend's explanation of a 413", async () => {
    respondWith(413, { message: 'That file is too large. The maximum upload size is 10 MB.' })

    await expect(uploadMedia(file)).rejects.toThrow(
      'That file is too large. The maximum upload size is 10 MB.',
    )
  })

  it('explains a 413 that arrives without a body, for example from a proxy', async () => {
    respondWith(413, undefined)

    await expect(uploadMedia(file)).rejects.toThrow(
      'That image is too large to upload. The maximum is 10 MB. '
      + 'Please resize or compress it and try again.',
    )
  })

  it('does not leave a bare status code as the whole message', async () => {
    respondWith(500, {})

    await expect(uploadMedia(file)).rejects.toThrow('Upload failed (500). Please try again.')
  })
})
