import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

/** A DDD poster (the narrow role) posts today's dish and it shows on the public site. */
test.describe('Admin daily dish CRUD (DDD poster)', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'DDD_POSTER')
  })

  test('a DDD poster posts a dish that appears live on Hubble', async ({ page }, testInfo) => {
    const admin = new AdminApp(page)
    await admin.goto('/daily-dish')

    await admin.addButton('Add dish').click()
    const form = page.locator('form')
    // Date defaults to today; just fill name + price. The dish-name input is the only
    // one without a type attribute (date=date, price=number), so target that precisely.
    await form.locator('input:not([type])').fill('E2E Stamppot')
    await form.getByRole('spinbutton').fill('8')
    await form.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('E2E Stamppot')).toBeVisible()
    await captureScreenshot(testInfo, page, 'ddd-poster-created-dish')

    await page.goto(`${HUBBLE_BASE_URL}/cafe/daily-dish`)
    await expect(page.getByRole('heading', { name: 'E2E Stamppot' })).toBeVisible()
    await expect(page.getByText('€8,00')).toBeVisible()
  })
})
