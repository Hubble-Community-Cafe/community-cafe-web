import { test, expect } from '@playwright/test'
import { resetBackend, seedWeeklyHours } from '../../fixtures/backend'
import { HubblePublic } from '../../pages/HubblePublic'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble home on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedWeeklyHours(request, 'HUBBLE', 'MONDAY', { open: '11:00', close: '02:00' })
  })

  test('renders the home page and CMS-driven footer hours on a phone', async ({ page }, testInfo) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoHome()

    await expect(page.getByRole('heading', { name: 'Opening Times' })).toBeVisible()
    await expect(hubble.footer().getByText('11:00 to 02:00')).toBeVisible()

    await captureScreenshot(testInfo, page, 'mobile-hubble-home')
  })
})
