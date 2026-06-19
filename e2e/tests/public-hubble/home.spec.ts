import { test, expect } from '@playwright/test'
import { resetBackend, seedWeeklyHours } from '../../fixtures/backend'
import { HubblePublic } from '../../pages/HubblePublic'
import { captureScreenshot } from '../../fixtures/evidence'

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

test.describe('Hubble home opening times', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    for (const day of WEEKDAYS) {
      await seedWeeklyHours(request, 'HUBBLE', day, { open: '11:00', close: '02:00' })
    }
    await seedWeeklyHours(request, 'HUBBLE', 'SATURDAY', { open: '15:00', close: '20:00' })
  })

  test('renders weekly hours from the CMS, grouped', async ({ page }, testInfo) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoHome()

    const card = page.getByRole('heading', { name: 'Opening Times' }).locator('..')
    await expect(card.getByText('Monday – Friday')).toBeVisible()
    await expect(card.getByText('11:00 – 02:00')).toBeVisible()
    await expect(card.getByText('Saturday')).toBeVisible()
    await expect(card.getByText('Sunday')).toBeVisible()
    await expect(card.getByText('Closed')).toBeVisible()

    await captureScreenshot(testInfo, page, 'home-opening-times')
  })

  test('footer shows the same hours, driven by the CMS', async ({ page }) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoHome()

    const footer = hubble.footer()
    await expect(footer.getByText('Monday – Friday')).toBeVisible()
    // Footer uses "to" (not the en-dash) and omits kitchen times.
    await expect(footer.getByText('11:00 to 02:00')).toBeVisible()
    await expect(footer.getByText(/Kitchen/)).toHaveCount(0)
  })
})
