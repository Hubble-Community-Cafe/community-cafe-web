import { test, expect } from '@playwright/test'
import { HubbleTipsForm } from '../../pages/PublicForms'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble tips/complaints/ideas form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a complaint emails nuisance and confirms the submitter', async ({ page, request }, testInfo) => {

    const tips = new HubbleTipsForm(page)
    await page.goto('/contact/tips')
    await expect(page.getByRole('heading', { name: 'Tips, Complaints & Ideas' })).toBeVisible()

    await tips.name.fill('Pim Tester')
    await tips.email.fill('pim@example.com')
    await tips.type.selectOption('COMPLAINT')
    await tips.wantsUpdates.selectOption('no')
    await tips.message.fill('The music upstairs is too loud on Fridays.')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-tips-sent')

    const mail = await waitForMessageTo(request, 'nuisance@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('Hubble Complaint from Pim Tester')
    expect(mail.text).toContain('Wants updates on this subject: No')
    expect(mail.text).toContain('music upstairs')

    const ack = await waitForMessageTo(request, 'pim@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your complaint')
  })

  test('a honeypot-filled submission is silently dropped (no email)', async ({ page, request }) => {

    const tips = new HubbleTipsForm(page)
    await page.goto('/contact/tips')
    await tips.name.fill('Bot')
    await tips.email.fill('bot@example.com')
    await tips.message.fill('spam')
    await page.locator('input[name="website"]').evaluate((el) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, 'http://spam.example')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await expectNoMessageTo(request, 'nuisance@hubble.cafe')
  })
})
