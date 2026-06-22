import { test, expect } from '@playwright/test'
import { resetBackend, seedWeeklyHours } from '../../fixtures/backend'

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

test.describe('Hubble plaza screen', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    for (const day of WEEKDAYS) {
      await seedWeeklyHours(request, 'HUBBLE', day, { open: '11:00', close: '02:00' })
    }
    await seedWeeklyHours(request, 'HUBBLE', 'SATURDAY', { open: '15:00', close: '20:00' })
  })

  test('is a full-bleed kiosk showing the opening times, with no site chrome', async ({ page }) => {
    await page.goto('/plaza-page')

    await expect(page.getByRole('heading', { name: 'Opening Times' })).toBeVisible()
    await expect(page.getByText('Monday – Friday')).toBeVisible()
    await expect(page.getByText('11:00 – 02:00')).toBeVisible()

    // No header navigation and no footer: it is a standalone display.
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
    await expect(page.locator('footer')).toHaveCount(0)
  })
})
