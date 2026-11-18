import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../playwright.config'
import { resetBackend, seedAssociation, seedUser, setUiRole, SEEDER_OID } from '../../fixtures/backend'
import { watchCspViolations, expectEnforcingCsp, expectNoCspViolations } from '../../fixtures/csp'
import { expectSecurityHeadersEverywhere } from '../../fixtures/securityHeaders'
import { ADMIN_ROUTES } from '../../fixtures/a11y'

/** A valid 1x1 PNG, so the browser really decodes an image served from the API origin. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * The admin runs under an enforcing Content-Security-Policy (admin/nginx-csp.conf). Visits every
 * page so a directive that blocks the API, an uploaded image or a style fails here instead of in
 * production. MSAL, Graph and the Aurora poster host are not exercised: the e2e stack signs in
 * through the test header bridge and has no poster base URL.
 */
test('every admin page loads under the Content-Security-Policy', async ({ page, request }, testInfo) => {
  await resetBackend(request)
  // ADMIN, so the admin-only pages render their real content instead of a permission error.
  await setUiRole(request, 'ADMIN')
  await seedUser(request, { oid: SEEDER_OID, role: 'ADMIN' })
  const upload = await request.post(`${BACKEND_URL}/api/admin/media`, {
    headers: { 'X-Test-Oid': SEEDER_OID },
    multipart: { file: { name: 'csp-logo.png', mimeType: 'image/png', buffer: PNG_1X1 } },
  })
  expect(upload.ok(), `media upload: ${upload.status()}`).toBe(true)
  const media: { id: number } = await upload.json()
  await seedAssociation(request, { name: 'CSP Association', bar: 'HUBBLE', logoId: media.id })

  const violations = await watchCspViolations(page)

  const response = await page.goto('/')
  expectEnforcingCsp(
    response,
    "script-src 'self'",
    "frame-ancestors 'none'",
    'https://login.microsoftonline.com',
    'https://graph.microsoft.com',
    BACKEND_URL,
  )

  for (const route of ADMIN_ROUTES.filter((r) => r !== '/')) {
    await page.goto(route)
    // Pages download on demand and show nothing meanwhile, so "no Loading…" alone could pass
    // before the page even started. Its title (every page has one, PageHeader) proves it rendered.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Let the page's data requests and images finish, so a blocked one is reported: every admin
    // page shows "Loading…" until its data is in, and an image is complete once loaded or failed.
    await expect(page.getByText('Loading…')).toHaveCount(0)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete))
  }

  // The uploaded logo, served from the API origin, really rendered (img-src allows it).
  await page.goto('/associations')
  const logo = page.getByRole('img', { name: 'CSP Association' })
  await expect(logo).toBeVisible()
  // Visible comes before decoded: an image still loading has its box but no width yet.
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBeGreaterThan(0)

  await expectNoCspViolations(violations, testInfo)
})

test('the admin document keeps its security headers next to the CSP', async ({ page }) => {
  const response = await page.goto('/')
  const headers = response!.headers()
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-robots-tag']).toBe('noindex, nofollow')
})

test('every admin response carries the security headers, without the nginx version', async ({ request }) => {
  await expectSecurityHeadersEverywhere(request, { robots: 'noindex, nofollow' })
})
