import { expect, test } from '@playwright/test'
import { resetBackend } from '../../fixtures/backend'
import { METEOR_FORMS, METEOR_ROUTES, expectNoNewA11yViolations, scanFormErrors, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the Meteor site on desktop, and on each form with its validation errors.
 * Violations that predate these checks are listed in fixtures/a11y-known-issues.ts; anything else fails.
 */
test('every page meets WCAG 2.2 AA, apart from the known issues', async ({ page, request }, testInfo) => {
  test.setTimeout(240_000)
  await resetBackend(request)
  await seedA11yContent(request)

  await scanRoutes(page, testInfo, METEOR_ROUTES)
  await scanFormErrors(page, testInfo, METEOR_FORMS)
})

test('keyboard: the first Tab shows "Skip to content", which moves focus to the page content', async ({ page, request }, testInfo) => {
  await resetBackend(request)
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await expectNoNewA11yViolations(page, testInfo, 'skip link focused')

  await page.keyboard.press('Enter')
  await expect(page.locator('main#main-content')).toBeFocused()
  expect(new URL(page.url()).hash).toBe('')

  // Following a link moves focus to the new page instead of leaving it on the clicked link.
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /agenda/i }).click()
  await expect(page.locator('main#main-content')).toBeFocused()
})
