import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../playwright.config'
import { resetBackend, seedUser, setUiRole } from '../../fixtures/backend'
import { expectNoNewA11yViolations } from '../../fixtures/a11y'
import { captureScreenshot } from '../../fixtures/evidence'
import { UsersAdminPage } from '../../pages/UsersAdminPage'

const STAFF = { oid: 'e2e-staff', email: 'staff@e2e.test', name: 'Sam Staff' }

type UserView = { email: string; admin: boolean; permissions: Record<string, string> }

/** How the backend now sees the seeded staff member. */
async function staffAccess(request: import('@playwright/test').APIRequestContext): Promise<UserView> {
  const res = await request.get(`${BACKEND_URL}/api/admin/users`, { headers: { 'X-Test-Oid': 'e2e-user' } })
  const users = (await res.json()) as UserView[]
  return users.find((u) => u.email === STAFF.email)!
}

test.describe('Admin users and per-tab access', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'ADMIN')
    await seedUser(request, { ...STAFF, role: 'STAFF' })
  })

  test('an admin gives someone edit access to one tab, which is saved and audited', async ({ page, request }, testInfo) => {
    const users = new UsersAdminPage(page)
    await users.goto()
    await expect(users.row(STAFF.name)).toContainText('No access yet')

    await users.changeAccessButton(STAFF.name).click()
    await users.level(STAFF.name, 'Events', 'Edit').click()
    await users.level(STAFF.name, 'Menu', 'View').click()
    await expectNoNewA11yViolations(page, testInfo, 'access form open')
    await captureScreenshot(testInfo, page, 'admin-users-access-form')
    await users.save(STAFF.name)

    await expect(users.form(STAFF.name)).toHaveCount(0)
    await expect(users.row(STAFF.name)).toContainText('Edits 1 tab, views 1 tab')
    const saved = await staffAccess(request)
    expect(saved.permissions).toMatchObject({ EVENTS: 'EDIT', MENU: 'VIEW', BOARD: 'HIDDEN' })

    const audit = await request.get(`${BACKEND_URL}/api/admin/audit?action=PERMISSIONS_CHANGED`, {
      headers: { 'X-Test-Oid': 'e2e-user' },
    })
    expect(JSON.stringify(await audit.json())).toContain(STAFF.email)
  })

  test('choosing a level keeps the page where it is', async ({ page }) => {
    // Short enough that the lower tabs are below the fold, which is where the window used to jump.
    await page.setViewportSize({ width: 1440, height: 700 })
    const users = new UsersAdminPage(page)
    await users.goto()
    await users.changeAccessButton(STAFF.name).click()

    await users.form(STAFF.name).getByRole('radiogroup', { name: 'Media' }).scrollIntoViewIfNeeded()
    const contentScroll = await page.evaluate(() => document.querySelector('main')!.scrollTop)
    await users.level(STAFF.name, 'Media', 'Edit').click()

    await expect(users.form(STAFF.name).getByRole('radiogroup', { name: 'Media' }).getByRole('radio', { name: 'Edit' }))
      .toBeChecked()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => document.querySelector('main')!.scrollTop)).toBe(contentScroll)
  })

  test('a preset fills every tab in one click', async ({ page, request }) => {
    const users = new UsersAdminPage(page)
    await users.goto()

    await users.changeAccessButton(STAFF.name).click()
    await users.form(STAFF.name).getByRole('button', { name: 'Editor' }).click()
    await users.save(STAFF.name)

    await expect(users.form(STAFF.name)).toHaveCount(0)
    const saved = await staffAccess(request)
    expect(Object.values(saved.permissions).every((level) => level === 'EDIT')).toBe(true)
    expect(saved.admin).toBe(false)
  })

  test('your own access cannot be changed from here', async ({ page }) => {
    const users = new UsersAdminPage(page)
    await users.goto()

    await expect(users.row('E2E User')).toContainText('ask another admin')
    await expect(users.changeAccessButton('E2E User')).toHaveCount(0)
  })
})
