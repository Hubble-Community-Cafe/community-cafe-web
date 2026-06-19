import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

/**
 * The manageability gate: an editor creates content in the admin and it appears live on
 * the public site, then can be removed again.
 */
test.describe('Admin associations CRUD round-trip', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('create shows up on the public site, then delete removes it', async ({ page }, testInfo) => {
    const admin = new AdminApp(page)
    await admin.goto('/associations')

    // Create (bar defaults to "Both", so it shows on Hubble).
    await admin.addButton('Add association').click()
    await page.getByPlaceholder('Inter Actief').fill('E2E Society')
    await page.getByRole('button', { name: 'Add association' }).click()

    const row = page.getByRole('listitem').filter({ hasText: 'E2E Society' })
    await expect(row).toBeVisible()
    await captureScreenshot(testInfo, page, 'admin-association-created')

    // Verify live on the public Hubble site.
    await page.goto(`${HUBBLE_BASE_URL}/community/associations`)
    await expect(page.getByText('E2E Society')).toBeVisible()

    // Back in the admin, delete it (accept the confirm dialog).
    await admin.goto('/associations')
    page.once('dialog', (d) => d.accept())
    await page.getByRole('listitem').filter({ hasText: 'E2E Society' })
      .getByRole('button').last().click()

    await expect(page.getByRole('listitem').filter({ hasText: 'E2E Society' })).toHaveCount(0)
  })
})
