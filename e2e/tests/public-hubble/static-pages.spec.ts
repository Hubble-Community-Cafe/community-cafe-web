import { test, expect } from '@playwright/test'

test.describe('Hubble shell and static pages', () => {
  test('header navigation reaches a static page', async ({ page }) => {
    await page.goto('/')
    // Hover the "Cafe" dropdown and follow "Discount policy".
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Cafe' }).hover()
    await page.getByRole('link', { name: 'Discount policy' }).click()
    await expect(page.getByRole('heading', { name: 'Discount policy' })).toBeVisible()
  })

  test('the cafe about page shows the living-room intro', async ({ page }) => {
    await page.goto('/cafe')
    await expect(page.getByRole('heading', { name: 'Living room of the Campus' })).toBeVisible()
    await expect(page.getByText('beating heart of the university')).toBeVisible()
  })

  test('the discount-policy page shows its real sections', async ({ page }) => {
    await page.goto('/cafe/discount-policy')
    await expect(page.getByRole('heading', { name: 'Discount policy' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Paying less for more beer' })).toBeVisible()
    await expect(page.getByText('12.5% discount on drinks')).toBeVisible()
  })

  test('the committees page lists committees with photos', async ({ page }) => {
    await page.goto('/community/committees')
    await expect(page.getByRole('heading', { name: 'Committees' })).toBeVisible()
    await expect(page.getByText('Cocktail Committee')).toBeVisible()
    await expect(page.getByText('Ducktales')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Cocktail Committee' })).toBeVisible()
  })

  test('the contact hub links out to each form', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Loan equipment/ }))
      .toHaveAttribute('href', '/contact/loan-equipment')
    await page.getByRole('link', { name: /Online declarations/ }).click()
    await expect(page.getByRole('heading', { name: 'Online Declarations' })).toBeVisible()
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await page.goto('/does-not-exist')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
