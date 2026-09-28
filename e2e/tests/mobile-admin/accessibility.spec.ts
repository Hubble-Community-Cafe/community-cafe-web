import { test } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { ADMIN_ROUTES, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the admin on a phone.
 * Violations that predate these checks are listed in fixtures/a11y-known-issues.ts; anything else fails.
 */
test('every page meets WCAG 2.2 AA, apart from the known issues', async ({ page, request }, testInfo) => {
  test.setTimeout(240_000)
  await resetBackend(request)
  await seedA11yContent(request)
  // ADMIN, so the admin-only pages render their real content.
  await setUiRole(request, 'ADMIN')

  await scanRoutes(page, testInfo, ADMIN_ROUTES)
})
