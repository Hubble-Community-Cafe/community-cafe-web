import { test } from '@playwright/test'
import { resetBackend } from '../../fixtures/backend'
import { METEOR_FORMS, METEOR_ROUTES, scanFormErrors, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the Meteor site on a phone, and on each form with its validation errors.
 * Violations that predate these checks are listed in fixtures/a11y-known-issues.ts; anything else fails.
 */
test('every page meets WCAG 2.2 AA, apart from the known issues', async ({ page, request }, testInfo) => {
  test.setTimeout(240_000)
  await resetBackend(request)
  await seedA11yContent(request)

  await scanRoutes(page, testInfo, METEOR_ROUTES)
  await scanFormErrors(page, testInfo, METEOR_FORMS)
})
