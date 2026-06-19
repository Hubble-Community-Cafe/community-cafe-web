import { test, expect } from '@playwright/test'

test.describe('Hubble shell and static pages', () => {
  test('header navigation reaches a static page', async ({ page }) => {
    await page.goto('/')
    // Hover the "Cafe" dropdown and follow "Discount policy".
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Cafe' }).hover()
    await page.getByRole('link', { name: 'Discount policy' }).click()
    await expect(page.getByRole('heading', { name: 'Discount policy' })).toBeVisible()
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await page.goto('/does-not-exist')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
