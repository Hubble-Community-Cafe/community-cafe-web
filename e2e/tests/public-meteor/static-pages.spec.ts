import { test, expect } from '@playwright/test'

test.describe('Meteor shell and static pages', () => {
  test('renders a static placeholder page', async ({ page }) => {
    await page.goto('/menu/discount-policy')
    await expect(page.getByRole('heading', { name: 'Discount policy' })).toBeVisible()
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await page.goto('/nope')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
