import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole, seedAssociation } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Admin on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('a viewer reads content read-only on a phone, with no edit affordances', async ({ page, request }, testInfo) => {
    await seedAssociation(request, { name: 'Inter Actief', bar: 'HUBBLE' })
    await setUiRole(request, 'VIEWER')

    const admin = new AdminApp(page)
    await admin.goto('/associations')

    await expect(page.getByText('Inter Actief')).toBeVisible()
    await expect(admin.addButton(/Add association/)).toHaveCount(0)
    await captureScreenshot(testInfo, page, 'mobile-admin-viewer-readonly')
  })

  test('an editor can add content on a phone', async ({ page, request }) => {
    await setUiRole(request, 'EDITOR')
    const admin = new AdminApp(page)

    await admin.goto('/associations')
    await expect(admin.addButton(/Add association/)).toBeVisible()
  })
})
