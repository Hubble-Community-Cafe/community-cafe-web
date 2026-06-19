import { test, expect } from '@playwright/test'
import { resetBackend, seedDailyDish, today, inDays } from '../../fixtures/backend'

test.describe('Hubble daily dinner dish', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedDailyDish(request, {
      date: today(), name: 'Spaghetti Bolognese', description: 'With garlic bread.', price: 7.5,
    })
    // A future dish must not show as today's.
    await seedDailyDish(request, { date: inDays(2), name: 'Future Curry' })
  })

  test("shows today's dish with its price", async ({ page }) => {
    await page.goto('/cafe/daily-dish')
    await expect(page.getByRole('heading', { name: 'Spaghetti Bolognese' })).toBeVisible()
    await expect(page.getByText('With garlic bread.')).toBeVisible()
    await expect(page.getByText('€7,50')).toBeVisible()
    await expect(page.getByText('Future Curry')).toHaveCount(0)
  })
})
