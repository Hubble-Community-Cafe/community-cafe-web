import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole, seedAssociation } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Admin role-based access', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('viewer sees content read-only, with no edit affordances', async ({ page, request }, testInfo) => {
    await seedAssociation(request, { name: 'Inter Actief', bar: 'HUBBLE' })
    await setUiRole(request, 'VIEWER')

    const admin = new AdminApp(page)
    await admin.goto('/associations')

    // Can read the content...
    await expect(page.getByText('Inter Actief')).toBeVisible()
    // ...but cannot add or edit.
    await expect(admin.addButton(/Add association/)).toHaveCount(0)
    const row = page.getByRole('listitem').filter({ hasText: 'Inter Actief' })
    await expect(row.getByRole('button')).toHaveCount(0)

    await captureScreenshot(testInfo, page, 'viewer-associations-readonly')
  })

  test('viewer cannot reach the admin-only areas', async ({ page, request }) => {
    await setUiRole(request, 'VIEWER')
    const admin = new AdminApp(page)
    await admin.goto('/')
    const nav = page.getByRole('navigation', { name: 'Admin' })
    await expect(nav.getByText('Users', { exact: true })).toHaveCount(0)
    await expect(nav.getByText('Audit log', { exact: true })).toHaveCount(0)
  })

  test('DDD poster can edit the daily dish but not the menu', async ({ page, request }) => {
    await setUiRole(request, 'DDD_POSTER')
    const admin = new AdminApp(page)

    await admin.goto('/daily-dish')
    await expect(admin.addButton(/Add dish/)).toBeVisible()

    await admin.goto('/menu')
    await expect(admin.addButton(/Add tab/)).toHaveCount(0)
  })

  test('editor can add content', async ({ page, request }) => {
    await setUiRole(request, 'EDITOR')
    const admin = new AdminApp(page)

    await admin.goto('/associations')
    await expect(admin.addButton(/Add association/)).toBeVisible()
  })
})
