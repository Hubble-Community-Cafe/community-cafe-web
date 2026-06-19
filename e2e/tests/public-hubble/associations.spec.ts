import { test, expect } from '@playwright/test'
import { resetBackend, seedAssociation } from '../../fixtures/backend'
import { HubblePublic } from '../../pages/HubblePublic'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble associations', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    // Seeded out of order to prove the public page sorts alphabetically.
    await seedAssociation(request, { name: 'Zeus', bar: 'HUBBLE' })
    await seedAssociation(request, { name: 'Alpha', bar: 'HUBBLE' })
    await seedAssociation(request, { name: 'Meteor Only', bar: 'METEOR' })
  })

  test('lists Hubble associations alphabetically and excludes Meteor-only ones', async ({ page }, testInfo) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoAssociations()

    await expect(page.getByText('Alpha')).toBeVisible()
    await expect(page.getByText('Zeus')).toBeVisible()
    await expect(page.getByText('Meteor Only')).toHaveCount(0)

    // Alphabetical: Alpha appears before Zeus in document order.
    const names = await page.getByRole('listitem').allInnerTexts()
    const joined = names.join('\n')
    expect(joined.indexOf('Alpha')).toBeLessThan(joined.indexOf('Zeus'))

    await captureScreenshot(testInfo, page, 'associations-grid')
  })
})
