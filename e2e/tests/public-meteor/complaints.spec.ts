import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Meteor tips/complaints form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a tip emails the nuisance list and shows a thank-you', async ({ page, request }, testInfo) => {
    await page.goto('/complaints')

    await page.locator('#name').fill('Jamie Tester')
    await page.locator('#email').fill('jamie@example.com')
    await page.locator('#message').fill('The terrace music is a great touch on Fridays.')
    await page.locator('#type').selectOption('TIP')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'meteor-complaint-sent')

    const mail = await waitForMessageTo(request, 'nuisance@hubble.cafe')
    expect(mail.subject).toBe('Meteor Tip from Jamie Tester')
    expect(mail.text).toContain('Jamie Tester')
    expect(mail.text).toContain('terrace music')
  })

  test('a missing message is rejected client-side (required)', async ({ page, request }) => {
    await page.goto('/complaints')
    await page.locator('#name').fill('No Message')
    await page.locator('#email').fill('x@example.com')
    await page.getByRole('button', { name: 'Send' }).click()

    // The required textarea blocks submission; no email is sent and we stay on the form.
    await expect(page.getByRole('heading', { name: 'Thank you!' })).toHaveCount(0)
    await expectNoMessageTo(request, 'nuisance@hubble.cafe')
  })
})
