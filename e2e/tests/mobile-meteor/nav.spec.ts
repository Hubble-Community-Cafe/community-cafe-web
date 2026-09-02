import { test, expect } from '@playwright/test'
import { resetBackend, seedEvent, inDays } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor mobile navigation', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedEvent(request, { bar: 'METEOR', title: 'Mobile Jazz Night', date: inDays(10) })
  })

  test('opens the mobile menu and follows it to the agenda', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Open menu' }).click()
    const mobileNav = page.getByRole('navigation', { name: 'Mobile' })
    await captureScreenshot(testInfo, page, 'meteor-mobile-menu-open')

    // "Agenda" is a top-level mobile link; the seeded event renders there on a phone.
    await mobileNav.getByRole('link', { name: 'Agenda' }).click()
    await expect(page).toHaveURL(/\/agenda$/)
    await expect(page.getByText('Mobile Jazz Night')).toBeVisible()
  })

  // The upload path is covered on desktop; on a phone what matters is that the form is
  // reachable at all, since it sits inside the Menu group rather than at the top level.
  test('reaches the declaration form from the mobile menu', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Open menu' }).click()
    const mobileNav = page.getByRole('navigation', { name: 'Mobile' })
    // Mobile groups start collapsed, so the "Menu" group has to be expanded first.
    await mobileNav.getByRole('button', { name: 'Menu' }).click()
    await mobileNav.getByRole('link', { name: 'Online Declarations' }).click()

    await expect(page).toHaveURL(/\/declarations$/)
    await expect(page.getByRole('heading', { name: 'Online Declarations' })).toBeVisible()
    await expect(page.locator('#d-iban')).toBeVisible()
  })
})
