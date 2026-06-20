import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin opening hours CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor sets Monday hours that flow to the public footer', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/hours') // defaults to the Hubble bar

    const row = page.getByRole('row').filter({ hasText: 'Monday' })
    await row.getByRole('button', { name: 'Set hours' }).click()
    const times = row.locator('input[type="time"]')
    await times.nth(0).fill('11:00') // open
    await times.nth(1).fill('23:00') // close
    await row.getByRole('button', { name: 'Save' }).click()

    await expect(row.getByText('11:00 – 23:00')).toBeVisible()

    // The CMS-driven footer on the public site now reflects it.
    await page.goto(`${HUBBLE_BASE_URL}/`)
    await expect(page.locator('footer').getByText('11:00 to 23:00')).toBeVisible()
  })
})
