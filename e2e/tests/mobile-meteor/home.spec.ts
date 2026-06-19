import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar: 'METEOR' })
    await seedMenuItem(request, tab.id, { name: 'Meteor Lager', regularPrice: 3.2 })
  })

  test('renders the home page and menu on a phone', async ({ page }, testInfo) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoHome()
    await expect(page.locator('footer')).toBeVisible()

    await meteor.gotoMenu()
    await expect(page.getByText('Meteor Lager')).toBeVisible()

    await captureScreenshot(testInfo, page, 'mobile-meteor-menu')
  })
})
