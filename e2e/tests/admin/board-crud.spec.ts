import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin board CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor adds a current term and member, shown on the public board', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/board')

    // Create a current executive term (shared across both bars).
    await admin.addButton('Add term').click()
    const termForm = page.locator('form')
    await termForm.getByPlaceholder('Board 2025 - September').fill('E2E Board 2027')
    await termForm.getByRole('checkbox', { name: 'Current term' }).check()
    await termForm.getByRole('button', { name: 'Create term' }).click()

    // The new term card is expanded (it is current); add a member.
    await page.getByRole('button', { name: 'Add member' }).click()
    const memberForm = page.locator('form')
    await memberForm.getByPlaceholder('Alice').fill('E2E Chairperson')
    await memberForm.getByRole('button', { name: 'Add member' }).click()

    await expect(page.getByText('E2E Chairperson')).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/community/board`)
    await expect(page.getByText('E2E Chairperson')).toBeVisible()
  })
})
