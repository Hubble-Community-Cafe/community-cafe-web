import { test, expect } from '@playwright/test'

test.describe('Hubble SEO meta', () => {
  test('sets a per-page title, description, OpenGraph and canonical', async ({ page }) => {
    await page.goto('/cafe/discount-policy')

    await expect(page).toHaveTitle('Discount policy | Hubble Community Cafe')
    await expect(page.locator('meta[name="description"]'))
      .toHaveAttribute('content', /discounts for TU\/e students/)
    await expect(page.locator('meta[property="og:title"]'))
      .toHaveAttribute('content', 'Discount policy | Hubble Community Cafe')
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', /\/cafe\/discount-policy$/)
  })

  test('updates the title on client-side navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Hubble Community Cafe')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Cafe' }).hover()
    await page.getByRole('link', { name: 'Discount policy' }).click()
    await expect(page).toHaveTitle('Discount policy | Hubble Community Cafe')
  })

  test('the 404 page is marked noindex', async ({ page }) => {
    await page.goto('/no-such-page')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
