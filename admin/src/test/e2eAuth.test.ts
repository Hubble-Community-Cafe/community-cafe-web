import { afterEach, describe, expect, it } from 'vitest'
import { getE2eAuth, isE2E } from '../lib/e2eAuth'

describe('e2eAuth', () => {
  afterEach(() => {
    window.__RUNTIME_CONFIG__ = { API_URL: 'http://localhost:8080' }
  })

  it('returns null when no e2e oid is injected', () => {
    expect(getE2eAuth()).toBeNull()
    expect(isE2E()).toBe(false)
  })

  it('ignores unsubstituted placeholders', () => {
    window.__RUNTIME_CONFIG__ = { E2E_AUTH_OID: '__E2E_AUTH_OID__' }
    expect(getE2eAuth()).toBeNull()
  })

  it('reads the injected identity when present', () => {
    window.__RUNTIME_CONFIG__ = {
      E2E_AUTH_OID: 'oid-1',
      E2E_AUTH_EMAIL: 'staff@hubble.cafe',
      E2E_AUTH_NAME: 'Staff One',
    }
    expect(getE2eAuth()).toEqual({ oid: 'oid-1', email: 'staff@hubble.cafe', name: 'Staff One' })
    expect(isE2E()).toBe(true)
  })
})
