import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { ADMIN_ROUTES, expectNoNewA11yViolations } from '../../fixtures/a11y'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

/** Titles of the guides (admin/src/lib/guideContent.ts), per route. */
const GUIDE_TITLES: Record<string, string> = {
  '/': 'Getting started', '/menu': 'Menu', '/daily-dish': 'Daily dish', '/hours': 'Opening hours',
  '/events': 'Events', '/board': 'Board', '/vacancies': 'Vacancies', '/associations': 'Associations',
  '/media': 'Media library', '/screens': 'Screens', '/users': 'Users', '/audit': 'Audit log',
}

test.describe('Admin in-app help', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'ADMIN')
  })

  test('every page has a Help button that opens its guide', async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    const admin = new AdminApp(page)
    for (const route of ADMIN_ROUTES) {
      await admin.goto(route)
      const dialog = await admin.openHelp()
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(GUIDE_TITLES[route])
      await expectNoNewA11yViolations(page, testInfo, `help ${route}`, { include: '[role="dialog"]' })
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(admin.helpButton()).toBeFocused()
    }
  })

  test('the menu guide explains student prices, with topics to move between', async ({ page }, testInfo) => {
    const admin = new AdminApp(page)
    await admin.goto('/menu')
    const dialog = await admin.openHelp()
    await dialog.getByRole('button', { name: 'TU/e student prices' }).click()
    await expect(dialog).toContainText('regular/student')
    await captureScreenshot(testInfo, page, 'menu-help-student-prices')
  })
})
