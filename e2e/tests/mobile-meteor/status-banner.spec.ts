import { test, expect } from '@playwright/test'
import { resetBackend, seedHoursOverride, today } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor status banner on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('shows the closed banner with its note on a phone', async ({ page, request }, testInfo) => {
    await seedHoursOverride(request, 'METEOR', {
      date: today(), closed: true, note: 'Closed for a private event',
    })

    const meteor = new MeteorPublic(page)
    await meteor.gotoHome()

    const banner = page.getByRole('status')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Closed for a private event')
    await captureScreenshot(testInfo, page, 'mobile-meteor-closed-banner')
  })
})
