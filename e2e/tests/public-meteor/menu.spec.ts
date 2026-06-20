import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'

test.describe('Meteor menu', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    // The public menu only renders items under a sub-category (tab -> sub -> item).
    const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar: 'METEOR' })
    const sub = await seedMenuCategory(request, { name: 'Lagers', kind: 'DRINK', bar: 'METEOR', parentId: tab.id })
    await seedMenuItem(request, sub.id, { name: 'Meteor Lager', regularPrice: 3.2 })
    // A Hubble-only item must not leak onto the Meteor site.
    const hubbleTab = await seedMenuCategory(request, { name: 'Hubble Drinks', kind: 'DRINK', bar: 'HUBBLE' })
    const hubbleSub = await seedMenuCategory(request, { name: 'Hubble Beers', kind: 'DRINK', bar: 'HUBBLE', parentId: hubbleTab.id })
    await seedMenuItem(request, hubbleSub.id, { name: 'Hubble Secret', regularPrice: 9.9 })
  })

  test('shows Meteor items only', async ({ page }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoMenu()

    await expect(page.getByText('Meteor Lager')).toBeVisible()
    await expect(page.getByText('Hubble Secret')).toHaveCount(0)
  })
})
