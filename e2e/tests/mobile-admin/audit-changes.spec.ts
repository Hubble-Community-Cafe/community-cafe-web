import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem, setUiRole } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'
import { AdminApp } from '../../pages/AdminApp'

test('the audit log shows what was added on a phone', async ({ page, request }, testInfo) => {
  await resetBackend(request)
  await setUiRole(request, 'ADMIN')
  const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar: 'HUBBLE' })
  const sub = await seedMenuCategory(request, { name: 'Cocktails', kind: 'DRINK', bar: 'HUBBLE', parentId: tab.id })
  await seedMenuItem(request, sub.id, { name: 'Mojito', regularPrice: 9.5 })

  await new AdminApp(page).goto('/audit')
  const row = page.getByRole('row').filter({ hasText: 'Created item: Mojito' })
  await row.getByRole('button', { name: /Show values/ }).click()

  await expect(row.locator('ins', { hasText: '9.50' })).toBeVisible()
  await captureScreenshot(testInfo, page, 'mobile-admin-audit-values')
})
