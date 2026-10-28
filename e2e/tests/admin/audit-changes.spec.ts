import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem, setUiRole } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'
import { AdminApp } from '../../pages/AdminApp'

/** The audit log shows exactly what an edit changed, not only that something was edited. */
test.describe('Audit log field changes', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'ADMIN')
    const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar: 'HUBBLE' })
    const sub = await seedMenuCategory(request, { name: 'Cocktails', kind: 'DRINK', bar: 'HUBBLE', parentId: tab.id })
    await seedMenuItem(request, sub.id, { name: 'Mojito', regularPrice: 9.5 })
  })

  test('a menu price edit shows the old and the new price', async ({ page }, testInfo) => {
    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^Drinks/ }).click()
    await page.getByRole('button', { name: /^Cocktails/ }).click()
    await page.getByRole('button', { name: 'Edit item' }).click()
    await page.getByLabel(/Regular price/).fill('10')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByLabel(/Regular price/)).toHaveCount(0)

    await admin.goto('/audit')
    const row = page.getByRole('row').filter({ hasText: 'Updated item: Mojito' })
    await row.getByRole('button', { name: 'Show changes (1)' }).click()

    await expect(row.getByText('Regular price:')).toBeVisible()
    await expect(row.locator('del', { hasText: '9.50' })).toBeVisible()
    await expect(row.locator('ins', { hasText: '10.00' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'admin-audit-price-change')
  })

  test('a new item shows the values it was created with', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/audit')

    const row = page.getByRole('row').filter({ hasText: 'Created item: Mojito' })
    await row.getByRole('button', { name: /Show values/ }).click()
    await expect(row.locator('ins', { hasText: '9.50' })).toBeVisible()
    await expect(row.locator('ins', { hasText: 'Cocktails' })).toBeVisible()
  })
})
