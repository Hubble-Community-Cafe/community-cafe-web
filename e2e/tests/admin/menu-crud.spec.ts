import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin menu CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor builds tab -> sub-category -> item that renders live with dual pricing', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/menu') // defaults to the Hubble bar

    // Top-level tab.
    await admin.addButton('Add tab').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Snacks')
    await page.getByRole('button', { name: 'Save' }).click()
    const tab = page.getByRole('button', { name: /E2E Snacks/ })
    await expect(tab).toBeVisible()

    // Sub-category inside the tab.
    await tab.click()
    await admin.addButton('Add sub-category').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Bowls')
    await page.getByRole('button', { name: 'Save' }).click()
    const sub = page.getByRole('button', { name: /E2E Bowls/ })
    await expect(sub).toBeVisible()

    // Item with TU/e dual pricing inside the sub-category.
    await sub.click()
    await admin.addButton('Add item').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Poke Bowl')
    await page.getByLabel(/Regular price/).fill('9.50')
    await page.getByLabel(/student price/i).fill('8.00')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('E2E Poke Bowl')).toBeVisible()

    // Live on the public Hubble menu, with the comma-decimal dual price.
    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText('E2E Poke Bowl')).toBeVisible()
    await expect(page.getByText('8,00')).toBeVisible()
  })
})
