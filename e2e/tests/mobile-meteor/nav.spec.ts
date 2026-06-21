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
})
