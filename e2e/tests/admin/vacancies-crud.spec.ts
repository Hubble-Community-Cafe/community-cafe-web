import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin vacancies CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor adds a Hubble vacancy that appears live on the public site', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/vacancies')

    await admin.addButton('Add vacancy').click()
    const form = page.locator('form')
    await form.getByPlaceholder('Manager').fill('E2E Floor Manager')
    await form.locator('select').selectOption('HUBBLE')
    await form.getByPlaceholder('10-15 hrs/week').fill('12 hrs/week')
    await form.getByRole('button', { name: 'Add vacancy' }).click()

    // Shows in the admin list...
    await expect(page.getByText('E2E Floor Manager')).toBeVisible()

    // ...and live on the public Hubble site.
    await page.goto(`${HUBBLE_BASE_URL}/vacancies`)
    await expect(page.getByText('E2E Floor Manager')).toBeVisible()
  })
})
