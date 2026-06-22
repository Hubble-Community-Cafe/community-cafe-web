import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole, seedDailyDish, seedEvent, seedHoursOverride, today, inDays } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('shows the quick-nav grid and live widgets with seeded data', async ({ page, request }) => {
    await setUiRole(request, 'EDITOR')
    await seedDailyDish(request, { date: today(), name: 'Dashboard Pasta' })
    await seedEvent(request, { bar: 'HUBBLE', title: 'Dashboard Quiz Night', date: inDays(5) })
    await seedHoursOverride(request, 'METEOR', { date: inDays(7), closed: true, note: 'Closed for cleaning' })

    const admin = new AdminApp(page)
    await admin.goto('/')
    const main = page.getByRole('main')

    // Quick-nav tiles (scoped to main so they don't collide with the sidebar links).
    await expect(main.getByRole('link', { name: 'Menu' })).toBeVisible()
    await expect(main.getByRole('link', { name: 'Media' })).toBeVisible()

    // Live widgets reflect the seeded data.
    await expect(main.getByText('Dashboard Pasta')).toBeVisible()
    await expect(main.getByText('Dashboard Quiz Night')).toBeVisible()
    await expect(main.getByText(/Closed for cleaning/)).toBeVisible()
  })

  test('warns when no daily dish is set for today', async ({ page, request }) => {
    await setUiRole(request, 'EDITOR')

    const admin = new AdminApp(page)
    await admin.goto('/')
    await expect(page.getByText('No dish set for today')).toBeVisible()
  })

  test('a viewer sees events but not the daily-dish or audit widgets', async ({ page, request }) => {
    await setUiRole(request, 'VIEWER')

    const admin = new AdminApp(page)
    await admin.goto('/')

    await expect(page.getByText('Upcoming events')).toBeVisible()
    await expect(page.getByText("Today’s daily dish")).toHaveCount(0)
    await expect(page.getByText('Recent activity')).toHaveCount(0)
  })

  test('an admin sees the recent-activity widget', async ({ page, request }) => {
    await setUiRole(request, 'ADMIN')

    const admin = new AdminApp(page)
    await admin.goto('/')
    await expect(page.getByText('Recent activity')).toBeVisible()
  })
})
