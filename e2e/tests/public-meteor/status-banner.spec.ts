import { test, expect } from '@playwright/test'
import { resetBackend, seedHoursOverride, today } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'
import { captureScreenshot } from '../../fixtures/evidence'

/**
 * The banner is derived from BarStatus. A today-dated override makes the state
 * deterministic regardless of the wall clock (a closed override wins over weekly hours).
 */
test.describe('Meteor open/closed status banner', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('shows a closed banner with the override note', async ({ page, request }, testInfo) => {
    await seedHoursOverride(request, 'METEOR', { date: today(), closed: true, note: 'Closed for a private event' })

    const meteor = new MeteorPublic(page)
    await meteor.gotoHome()

    const banner = page.getByRole('status')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Closed for a private event')

    await captureScreenshot(testInfo, page, 'meteor-closed-banner')
  })

  test('shows an open notice when an override opens with a message', async ({ page, request }) => {
    await seedHoursOverride(request, 'METEOR', { date: today(), closed: false, note: 'Open late tonight' })

    const meteor = new MeteorPublic(page)
    await meteor.gotoHome()

    const banner = page.getByRole('status')
    await expect(banner).toContainText('Open late tonight')
  })
})
