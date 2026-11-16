import { test, expect } from '@playwright/test'
import { MeteorComplaintsForm } from '../../pages/PublicForms'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor tips/complaints form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a tip emails the nuisance list and shows a thank-you', async ({ page, request }, testInfo) => {

    const complaints = new MeteorComplaintsForm(page)
    await page.goto('/complaints')

    await complaints.name.fill('Jamie Tester')
    await complaints.email.fill('jamie@example.com')
    await complaints.message.fill('The terrace music is a great touch on Fridays.')
    await complaints.type.selectOption('TIP')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'meteor-complaint-sent')

    const mail = await waitForMessageTo(request, 'nuisance@hubble.cafe')
    expect(mail.from).toBe('noreply@meteor.cafe')
    expect(mail.subject).toBe('Meteor Tip from Jamie Tester')
    expect(mail.text).toContain('Jamie Tester')
    expect(mail.text).toContain('terrace music')

    // The submitter also receives a confirmation, from the site noreply address, that does not
    // echo their own text back.
    const ack = await waitForMessageTo(request, 'jamie@example.com')
    expect(ack.from).toBe('noreply@meteor.cafe')
    expect(ack.subject).toBe('We received your tip')
    expect(ack.text).toContain('Type: Tip')
    expect(ack.text).not.toContain('terrace music')
  })

  test('a missing message is rejected client-side (required)', async ({ page, request }) => {

    const complaints = new MeteorComplaintsForm(page)
    await page.goto('/complaints')
    await complaints.name.fill('No Message')
    await complaints.email.fill('x@example.com')
    await page.getByRole('button', { name: 'Send' }).click()

    // The required textarea blocks submission; no email is sent and we stay on the form.
    await expect(page.getByRole('heading', { name: 'Thank you!' })).toHaveCount(0)
    await expectNoMessageTo(request, 'nuisance@hubble.cafe')
  })
})
