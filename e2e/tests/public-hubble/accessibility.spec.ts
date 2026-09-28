import { expect, test } from '@playwright/test'
import { resetBackend } from '../../fixtures/backend'
import { HUBBLE_FORMS, HUBBLE_ROUTES, expectNoNewA11yViolations, scanFormErrors, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the Hubble site on desktop, and on each form with its validation errors.
 * Violations that predate these checks are listed in fixtures/a11y-known-issues.ts; anything else fails.
 */
test('every page meets WCAG 2.2 AA, apart from the known issues', async ({ page, request }, testInfo) => {
  test.setTimeout(240_000)
  await resetBackend(request)
  await seedA11yContent(request)

  await scanRoutes(page, testInfo, HUBBLE_ROUTES)
  await scanFormErrors(page, testInfo, HUBBLE_FORMS)
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
  // From the footer, so this also covers starting the new page at the top.
  await page.getByRole('contentinfo').getByRole('link', { name: 'Events' }).click()
  await expect(page).toHaveURL(/\/events$/)
  await expect(page.locator('main#main-content')).toBeFocused()
  // The URL changes a moment before React renders the new page and resets the scroll.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
