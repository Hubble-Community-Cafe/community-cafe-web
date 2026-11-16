import { expect, type APIRequestContext } from '@playwright/test'

/**
 * nginx drops inherited add_header directives in any location that sets its own, so the security
 * headers once went missing on scripts, /config.js and /health while the HTML page still had them.
 * Every kind of response is checked here: the document, a real built asset, the runtime config
 * and the health check. The Server header must not reveal the nginx version (server_tokens off).
 */
export async function expectSecurityHeadersEverywhere(
  request: APIRequestContext,
  { robots }: { robots?: string } = {},
) {
  const page = await request.get('/')
  const asset = (await page.text()).match(/\/assets\/[^"']+\.js/)?.[0]
  expect(asset, 'index.html references a built script').toBeTruthy()

  for (const path of ['/', asset!, '/config.js', '/health']) {
    const headers = (await request.get(path, { maxRedirects: 0 })).headers()
    expect.soft(headers['x-content-type-options'], `${path} nosniff`).toBe('nosniff')
    expect.soft(headers['x-frame-options'], `${path} X-Frame-Options`).toBe('DENY')
    expect.soft(headers['referrer-policy'], `${path} Referrer-Policy`).toBe('strict-origin-when-cross-origin')
    expect.soft(headers['permissions-policy'], `${path} Permissions-Policy`).toContain('camera=()')
    if (robots) expect.soft(headers['x-robots-tag'], `${path} X-Robots-Tag`).toBe(robots)
    expect.soft(headers['server'] ?? '', `${path} Server`).not.toMatch(/\d/)
  }
}
