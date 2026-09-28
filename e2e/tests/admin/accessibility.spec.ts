import { expect, test } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { ADMIN_ROUTES, expectNoNewA11yViolations, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the admin on desktop.
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

test('keyboard: the first Tab shows "Skip to content", which moves focus to the page content', async ({ page, request }, testInfo) => {
  await resetBackend(request)
  await setUiRole(request, 'EDITOR')
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
  await page.getByRole('navigation', { name: 'Admin' }).getByText('Menu', { exact: true }).click()
  await expect(page.locator('main#main-content')).toBeFocused()
})
