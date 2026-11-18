import { test, expect } from '@playwright/test'
import { MeteorComplaintsForm } from '../../pages/PublicForms'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor complaints form on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submits a tip from a phone, emailing the team and a confirmation', async ({ page, request }, testInfo) => {

    const complaints = new MeteorComplaintsForm(page)
    await page.goto('/complaints')

    await complaints.name.fill('Mobile Jamie')
    await complaints.email.fill('mobile.jamie@example.com')
    await complaints.message.fill('The mobile site is lovely.')
    await complaints.type.selectOption('TIP')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'mobile-meteor-complaint-sent')

    const mail = await waitForMessageTo(request, 'nuisance@hubble.cafe')
    expect(mail.subject).toBe('Meteor Tip from Mobile Jamie')

    const ack = await waitForMessageTo(request, 'mobile.jamie@example.com')
    expect(ack.subject).toBe('We received your tip')
  })
})
