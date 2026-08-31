import { test, expect } from '@playwright/test'

/**
 * Every alias domain resolves to this same container in production. A visitor served on one of
 * them gets a site that looks healthy but whose menu, opening hours and status banner all fail,
 * because the backend allowlists the canonical origins only and rejects the rest with a CORS 403.
 * nginx therefore sends aliases to the canonical host. Requests here go through the API request
 * context rather than the browser, so the Host header can be set and redirects can be inspected
 * instead of followed.
 */
const ALIAS_HOSTS = [
  'ducksandbears.cafe',
  'ducksandbears.nl',
  'hubblecafe.nl',
  'hubblecommunity.cafe',
  'barpotential.nl',
  'www.hubble.cafe',
]

const CANONICAL_HOSTS = ['hubble.cafe', 'test.hubble.cafe', '127.0.0.1']

test.describe('Hubble canonical host', () => {
  for (const host of ALIAS_HOSTS) {
    test(`${host} redirects to the canonical apex`, async ({ request }) => {
      const response = await request.get('/cafe/menu', {
        headers: { host },
        maxRedirects: 0,
      })
      expect(response.status()).toBe(301)
      expect(response.headers()['location']).toBe('https://hubble.cafe/cafe/menu')
    })
  }

  for (const host of CANONICAL_HOSTS) {
    test(`${host} is served rather than redirected`, async ({ request }) => {
      const response = await request.get('/cafe/menu', { headers: { host }, maxRedirects: 0 })
      expect(response.status()).toBe(200)
    })
  }

  test('the health check answers on an alias host, so orchestrators keep working', async ({
    request,
  }) => {
    const response = await request.get('/health', {
      headers: { host: 'ducksandbears.cafe' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(200)
    expect(await response.text()).toBe('OK')
  })

  test('old permalinks redirect without dropping to plain http', async ({ request }) => {
    // Relative Location: nginx would otherwise build an absolute one from $scheme, which is http
    // inside the container, sending the visitor through a plaintext hop.
    const response = await request.get('/menu/', {
      headers: { host: 'hubble.cafe' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toBe('/cafe/menu')
  })
})
