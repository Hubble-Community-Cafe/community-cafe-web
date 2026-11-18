import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PublicClientApplication } from '@azure/msal-browser'

/**
 * Sign-in skipped the `__AZURE_CLIENT_ID__` placeholder that config.js holds outside containers,
 * but the API token request did not: it asked for a token for "api://__AZURE_CLIENT_ID__".
 */
describe('the API token', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    delete window.__RUNTIME_CONFIG__
    vi.resetModules()
  })

  async function scopeRequestedWith(runtime: Record<string, string>, envClientId: string) {
    window.__RUNTIME_CONFIG__ = runtime
    vi.stubEnv('VITE_AZURE_CLIENT_ID', envClientId)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })))
    const acquireTokenSilent = vi.fn().mockResolvedValue({ accessToken: 'token' })
    const { setMsalInstance, fetchWithAuth } = await import('../lib/api/client')
    setMsalInstance({ getAllAccounts: () => [{}], acquireTokenSilent } as unknown as PublicClientApplication)

    await fetchWithAuth('/api/admin/events')
    return acquireTokenSilent.mock.calls[0][0].scopes
  }

  it('is for the same app registration sign-in uses, ignoring a placeholder', async () => {
    expect(await scopeRequestedWith({ AZURE_CLIENT_ID: '__AZURE_CLIENT_ID__' }, 'dev-client'))
      .toEqual(['api://dev-client/access_as_user'])
  })

  it('takes the injected client id in a container', async () => {
    expect(await scopeRequestedWith({ AZURE_CLIENT_ID: 'prod-client' }, 'dev-client'))
      .toEqual(['api://prod-client/access_as_user'])
  })
})
