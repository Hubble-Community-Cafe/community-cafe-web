import { afterEach, describe, expect, it } from 'vitest'
import { runtimeConfig } from './runtimeConfig'

describe('runtimeConfig', () => {
  afterEach(() => {
    delete window.__RUNTIME_CONFIG__
  })

  it('gives the value the container injected', () => {
    window.__RUNTIME_CONFIG__ = { API_URL: ' https://api.hubble.cafe ' }
    expect(runtimeConfig('API_URL')).toBe('https://api.hubble.cafe')
  })

  it('treats a missing, blank or not yet substituted value as not set, so callers fall back', () => {
    window.__RUNTIME_CONFIG__ = { API_URL: '__API_URL__', SENTRY_DSN: '  ' }
    expect(runtimeConfig('API_URL')).toBeUndefined()
    expect(runtimeConfig('SENTRY_DSN')).toBeUndefined()
    expect(runtimeConfig('AZURE_CLIENT_ID')).toBeUndefined()
    delete window.__RUNTIME_CONFIG__
    expect(runtimeConfig('API_URL')).toBeUndefined()
  })
})
