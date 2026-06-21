import { test, expect } from '@playwright/test'
import { resetBackend, seedWeeklyHours } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

test.describe('Meteor footer opening hours', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    for (const day of WEEKDAYS) {
      await seedWeeklyHours(request, 'METEOR', day, { open: '11:00', close: '01:00' })
    }
    await seedWeeklyHours(request, 'METEOR', 'SATURDAY', { open: '15:00', close: '20:00' })
  })

  test('footer shows the weekly hours from the CMS, grouped', async ({ page }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoHome()

    const footer = page.locator('footer')
    await expect(footer.getByText('Opening hours')).toBeVisible()
    await expect(footer.getByText('Monday – Friday')).toBeVisible()
    // Footer uses "to" (not the en-dash) between the times.
    await expect(footer.getByText('11:00 to 01:00')).toBeVisible()
    await expect(footer.getByText('Saturday')).toBeVisible()
    // Sunday has no hours seeded, so it renders as closed.
    await expect(footer.getByText(/Sunday.*closed/i)).toBeVisible()
  })
})
