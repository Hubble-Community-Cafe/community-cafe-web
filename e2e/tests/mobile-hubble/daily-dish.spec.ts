import { test, expect } from '@playwright/test'
import { resetBackend, seedDailyDish, today } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble daily dish on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedDailyDish(request, {
      date: today(), name: 'Spaghetti Bolognese', description: 'With garlic bread.', price: 7.5,
    })
  })

  test("shows today's dish with its price on a phone", async ({ page }, testInfo) => {
    await page.goto('/cafe/daily-dish')
    await expect(page.getByRole('heading', { name: 'Spaghetti Bolognese' })).toBeVisible()
    await expect(page.getByText('€7,50')).toBeVisible()
    await captureScreenshot(testInfo, page, 'mobile-hubble-daily-dish')
  })
})
