import { test, expect } from '@playwright/test'
import { resetBackend, seedAssociation } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble mobile navigation', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedAssociation(request, { name: 'Mobile Society', bar: 'HUBBLE' })
  })

  test('opens the mobile menu and navigates to a section', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Open menu' }).click()
    const mobileNav = page.getByRole('navigation', { name: 'Mobile' })
    await captureScreenshot(testInfo, page, 'mobile-menu-open')

    // Expand the "Community" group, then follow "Associations".
    await mobileNav.getByRole('button', { name: 'Community' }).click()
    await mobileNav.getByRole('link', { name: 'Associations' }).click()

    await expect(page.getByRole('heading', { name: 'Associations' })).toBeVisible()
    await expect(page.getByText('Mobile Society')).toBeVisible()
  })
})
