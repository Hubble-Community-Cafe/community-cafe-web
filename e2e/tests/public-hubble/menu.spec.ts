import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem } from '../../fixtures/backend'
import { HubblePublic } from '../../pages/HubblePublic'

test.describe('Hubble menu', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar: 'HUBBLE' })
    const sub = await seedMenuCategory(request, { name: 'Beers', kind: 'DRINK', bar: 'HUBBLE', parentId: tab.id })
    await seedMenuItem(request, sub.id, { name: 'House Pils', regularPrice: 3.0, studentPrice: 2.5 })
  })

  test('renders seeded categories and items with dual pricing', async ({ page }) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoMenu()

    await expect(page.getByText('House Pils')).toBeVisible()
    await expect(page.getByText('2.50')).toBeVisible()
  })
})
