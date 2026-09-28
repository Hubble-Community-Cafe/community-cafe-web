import { test, expect } from '@playwright/test'

test.describe('Meteor SEO meta', () => {
  test('sets a per-page title, description, OpenGraph, preview image and canonical', async ({ page }) => {
    await page.goto('/menu/discount-policy')

    await expect(page).toHaveTitle('Discount policy | Meteor Community Cafe')
    await expect(page.locator('meta[name="description"]'))
      .toHaveAttribute('content', /discounts for TU\/e students/)
    await expect(page.locator('meta[property="og:title"]'))
      .toHaveAttribute('content', 'Discount policy | Meteor Community Cafe')
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Meteor Community Cafe')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og-image\.jpg$/)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', /\/menu\/discount-policy$/)
  })

  test('the preview image is served as a 1200x630 JPEG', async ({ page, request }) => {
    await page.goto('/')
    const image = await page.locator('meta[property="og:image"]').getAttribute('content')
    const response = await request.get(image!)

    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image/jpeg')
    const size = await page.evaluate(async (src) => {
      const img = new Image()
      img.src = src
      await img.decode()
      return [img.naturalWidth, img.naturalHeight]
    }, image!)
    expect(size).toEqual([1200, 630])
  })

  test('every page has its own title', async ({ page }) => {
    const titles = new Map<string, string>()
    for (const route of ['/', '/menu', '/menu/discount-policy', '/agenda', '/community/board',
      '/community/board/previous', '/complaints', '/declarations', '/privacy']) {
      await page.goto(route)
      // index.html already carries the site name as the title; pages load on demand and then set
      // their own, so wait for that instead of reading the placeholder.
      if (route !== '/') await expect(page).not.toHaveTitle('Meteor Community Cafe')
      await expect(page).toHaveTitle(/Meteor Community Cafe$/)
      titles.set(route, await page.title())
    }
    expect(new Set(titles.values()).size, JSON.stringify(Object.fromEntries(titles))).toBe(titles.size)
  })

  test('updates the title on client-side navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Meteor Community Cafe')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /agenda/i }).click()
    await expect(page).toHaveTitle('Agenda | Meteor Community Cafe')
  })

  test('the 404 page is marked noindex', async ({ page }) => {
    await page.goto('/no-such-page')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
