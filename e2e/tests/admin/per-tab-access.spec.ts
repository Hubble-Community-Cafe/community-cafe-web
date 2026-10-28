import { test, expect } from '@playwright/test'
import { resetBackend, seedEvent, setUiAccess, inDays } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'
import { ScreensAdminPage } from '../../pages/ScreensAdminPage'
import { captureScreenshot } from '../../fixtures/evidence'

/** Access set per tab: each tab is hidden, readable or editable on its own. */
test.describe('Admin per-tab access', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('a new account sees only the dashboard, which says to ask an admin', async ({ page, request }, testInfo) => {
    await setUiAccess(request, {})
    const admin = new AdminApp(page)
    await admin.goto('/')

    await expect(page.getByText(/do not have access to any part of the admin yet/)).toBeVisible()
    await expect(admin.navLink('Dashboard')).toBeVisible()
    for (const label of ['Menu', 'Events', 'Media', 'Screens', 'Users']) {
      await expect(admin.navLink(label)).toHaveCount(0)
    }
    await captureScreenshot(testInfo, page, 'admin-new-account-dashboard')

    // Typing the address of a hidden tab lands back on the dashboard.
    await admin.goto('/menu')
    await expect(page).toHaveURL(/\/$/)
  })

  test('someone with only some tabs sees and edits exactly those', async ({ page, request }, testInfo) => {
    await seedEvent(request, { bar: 'HUBBLE', title: 'Per-tab Quiz', date: inDays(3) })
    await setUiAccess(request, { EVENTS: 'EDIT', MENU: 'VIEW' })
    const admin = new AdminApp(page)
    await admin.goto('/')

    await expect(page.getByText('You can edit Events.')).toBeVisible()
    await expect(page.getByText('You can view Menu.')).toBeVisible()
    await expect(admin.navLink('Events')).toBeVisible()
    await expect(admin.navLink('Menu')).toBeVisible()
    await expect(admin.navLink('Board')).toHaveCount(0)
    await captureScreenshot(testInfo, page, 'admin-per-tab-dashboard')

    await admin.goto('/events')
    await expect(page.getByText('Per-tab Quiz')).toBeVisible()
    await expect(admin.addButton(/Add event/)).toBeVisible()

    await admin.goto('/menu')
    await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible()
    await expect(admin.addButton(/Add tab/)).toHaveCount(0)

    await admin.goto('/board')
    await expect(page).toHaveURL(/\/$/)
  })

  test('view access on Screens shows the scene without switch buttons', async ({ page, request }) => {
    await setUiAccess(request, { SCREENS: 'VIEW' })
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    await expect(screens.currentScene()).toHaveText('Open')
    await expect(page.getByText(/can see what the screens show, but not switch them/)).toBeVisible()
    await expect(screens.sceneButton('Closed')).toHaveCount(0)
    await expect(screens.posterSelect('Closed')).toHaveCount(0)
  })

  test('Screen posters alone picks the posters but cannot switch', async ({ page, request }) => {
    await setUiAccess(request, { SCREEN_POSTERS: 'EDIT' })
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    await expect(screens.posterSelect('Closed')).toBeVisible()
    await expect(screens.sceneButton('Closed')).toHaveCount(0)
  })
})
