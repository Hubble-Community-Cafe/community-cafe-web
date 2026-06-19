import { test, expect } from '@playwright/test'
import { resetBackend, seedEvent, inDays } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'

test.describe('Meteor agenda', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedEvent(request, {
      bar: 'METEOR', title: 'Live Jazz Evening', date: inDays(12), description: 'Smooth tunes all night.',
    })
    await seedEvent(request, { bar: 'HUBBLE', title: 'Hubble Only Event', date: inDays(9) })
  })

  test('shows upcoming Meteor events only', async ({ page }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoAgenda()
    await expect(page.getByText('Live Jazz Evening')).toBeVisible()
    await expect(page.getByText('Hubble Only Event')).toHaveCount(0)
  })
})
