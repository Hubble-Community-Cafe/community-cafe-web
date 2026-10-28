import { test, expect } from '@playwright/test'
import { resetBackend, seedUser, setUiRole } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'
import { UsersAdminPage } from '../../pages/UsersAdminPage'

test.describe('Users on mobile', () => {
  test('an admin sets someone\'s access on a phone', async ({ page, request }, testInfo) => {
    await resetBackend(request)
    await setUiRole(request, 'ADMIN')
    await seedUser(request, { oid: 'e2e-staff', email: 'staff@e2e.test', name: 'Sam Staff', role: 'STAFF' })

    const users = new UsersAdminPage(page)
    await users.goto()
    await users.changeAccessButton('Sam Staff').click()
    await users.level('Sam Staff', 'Daily dish', 'Edit').click()
    await captureScreenshot(testInfo, page, 'mobile-admin-users-access-form')
    await users.save('Sam Staff')

    await expect(users.row('Sam Staff')).toContainText('Edits 1 tab')
  })
})
