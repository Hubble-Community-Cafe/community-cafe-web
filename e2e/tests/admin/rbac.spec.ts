import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../playwright.config'
import { resetBackend, setUiRole, seedAssociation, seedUser } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'
import { attachJson, captureScreenshot } from '../../fixtures/evidence'

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

  test('a tenant member outside the staff group is refused and never provisioned', async ({ request }, testInfo) => {
    // The e2e backend runs with ALLOWED_GROUP_ID=e2e-staff-group, and the header login puts that
    // group in the token by default. X-Test-Groups impersonates someone outside the staff group.
    await seedUser(request, { oid: 'e2e-admin', role: 'ADMIN' })
    await setUiRole(request, 'VIEWER')
    const outsider = { 'X-Test-Oid': 'e2e-outsider', 'X-Test-Groups': 'some-other-group' }

    const outsiderMe = await request.get(`${BACKEND_URL}/api/admin/users/me`, { headers: outsider })
    const outsiderEvents = await request.get(`${BACKEND_URL}/api/admin/events/HUBBLE`, { headers: outsider })
    const staffMe = await request.get(`${BACKEND_URL}/api/admin/users/me`, {
      headers: { 'X-Test-Oid': 'e2e-user' },
    })
    const users = await request.get(`${BACKEND_URL}/api/admin/users`, { headers: { 'X-Test-Oid': 'e2e-admin' } })
    const userOids: string[] = (await users.json()).map((u: { azureOid: string }) => u.azureOid)

    await attachJson(testInfo, 'rbac-group-results.json', {
      outsiderMe: outsiderMe.status(),
      outsiderEvents: outsiderEvents.status(),
      staffMe: staffMe.status(),
      userOids,
    })

    expect(outsiderMe.status()).toBe(403)
    expect(outsiderEvents.status()).toBe(403)
    expect(staffMe.status()).toBe(200) // staff group members are unaffected
    expect(userOids).not.toContain('e2e-outsider') // no admin_user row was created
  })
})
