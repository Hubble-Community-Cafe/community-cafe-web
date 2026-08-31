import { test, expect } from '@playwright/test'

/**
 * Meteor's alias domains resolve to this same container in production, and the backend allowlists
 * the canonical origins only, so a site served on an alias loses every CMS module to a CORS 403
 * while still looking healthy. nginx redirects them to the canonical host instead. Requests go
 * through the API request context rather than the browser, so the Host header can be set and
 * redirects inspected instead of followed.
 */
const ALIAS_HOSTS = [
  'meteorcommunity.cafe',
  'meteorcommunity.nl',
  'meteorcommunitycafe.nl',
  'www.meteor.cafe',
]

const CANONICAL_HOSTS = ['meteor.cafe', 'test.meteor.cafe', '127.0.0.1']

test.describe('Meteor canonical host', () => {
  for (const host of ALIAS_HOSTS) {
    test(`${host} redirects to the canonical apex`, async ({ request }) => {
      const response = await request.get('/menu', { headers: { host }, maxRedirects: 0 })
      expect(response.status()).toBe(301)
      expect(response.headers()['location']).toBe('https://meteor.cafe/menu')
    })
  }

  for (const host of CANONICAL_HOSTS) {
    test(`${host} is served rather than redirected`, async ({ request }) => {
      const response = await request.get('/menu', { headers: { host }, maxRedirects: 0 })
      expect(response.status()).toBe(200)
    })
  }

  test('the health check answers on an alias host, so orchestrators keep working', async ({
    request,
  }) => {
    const response = await request.get('/health', {
      headers: { host: 'meteorcommunity.nl' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(200)
    expect(await response.text()).toBe('OK')
  })

  test('old permalinks redirect without dropping to plain http', async ({ request }) => {
    // Relative Location: nginx would otherwise build an absolute one from $scheme, which is http
    // inside the container, sending the visitor through a plaintext hop.
    const response = await request.get('/community/', {
      headers: { host: 'meteor.cafe' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toBe('/community/board')
  })
})
