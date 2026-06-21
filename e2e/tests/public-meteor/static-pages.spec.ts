import { test, expect } from '@playwright/test'

test.describe('Meteor shell and static pages', () => {
  test('the discount-policy page shows its real content', async ({ page }) => {
    await page.goto('/menu/discount-policy')
    await expect(page.getByRole('heading', { name: 'Discount policy' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Discounts' })).toBeVisible()
    await expect(page.getByText('up to 25% discount on drinks')).toBeVisible()
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await page.goto('/nope')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
