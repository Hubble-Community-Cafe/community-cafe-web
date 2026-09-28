import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOverride, updateOverride } from '../lib/api'

/** The override calls pass the backend's validation message through to the page. */
describe('override API', () => {
  const req = { date: '2030-12-24', closed: false, open: '20:00', close: null, note: null }
  beforeEach(() => { window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: 'test-oid' } })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
  })
  const respondWith = (status: number, body?: unknown) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: status < 300, status,
      json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
    }))
  }

  it('updateOverride PUTs to the override and returns it', async () => {
    respondWith(200, { id: 4, ...req })
    await expect(updateOverride(4, req)).resolves.toMatchObject({ id: 4 })
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.stringContaining('/api/admin/opening-hours/overrides/4'),
      expect.objectContaining({ method: 'PUT' }))
  })

  it("rejects with the backend's message", async () => {
    respondWith(400, { message: 'Enter both an opening and a closing time, or leave both empty to show "Open".' })
    await expect(createOverride('HUBBLE', req)).rejects.toThrow('Enter both an opening and a closing time')
  })

  it('rejects with a general message when there is none', async () => {
    respondWith(500)
    await expect(updateOverride(4, req)).rejects.toThrow('Could not save the override (500). Please try again.')
  })
})
