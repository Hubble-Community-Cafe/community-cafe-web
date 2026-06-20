import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole, inDays } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin events CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor adds a Hubble event that appears live on the public site', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/events') // defaults to the Hubble bar

    await admin.addButton('Add event').click()
    const form = page.locator('form')
    await form.getByPlaceholder('Quiz Night').fill('E2E Karaoke Night')
    await form.locator('input[type="date"]').fill(inDays(21))
    await form.getByRole('button', { name: 'Create event' }).click()

    await expect(page.getByText('E2E Karaoke Night')).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/events`)
    await expect(page.getByRole('heading', { name: 'E2E Karaoke Night' })).toBeVisible()
  })
})
