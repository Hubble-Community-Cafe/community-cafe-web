import { test, expect } from '@playwright/test'
import { HubbleTipsForm } from '../../pages/PublicForms'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble tips form on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submits a tip from a phone, emailing the team and a confirmation', async ({ page, request }, testInfo) => {

    const tips = new HubbleTipsForm(page)
    await page.goto('/contact/tips')

    await tips.name.fill('Mobile Pim')
    await tips.email.fill('mobile.pim@example.com')
    await tips.type.selectOption('TIP')
    await tips.message.fill('Great mobile experience.')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'mobile-hubble-tip-sent')

    const mail = await waitForMessageTo(request, 'nuisance@hubble.cafe')
    expect(mail.subject).toBe('Hubble Tip from Mobile Pim')

    const ack = await waitForMessageTo(request, 'mobile.pim@example.com')
    expect(ack.subject).toBe('We received your tip')
  })
})
