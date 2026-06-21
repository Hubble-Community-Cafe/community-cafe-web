import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble tips/complaints/ideas form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a complaint emails nuisance and confirms the submitter', async ({ page, request }, testInfo) => {
    await page.goto('/contact/tips')
    await expect(page.getByRole('heading', { name: 'Tips, Complaints & Ideas' })).toBeVisible()

    await page.locator('#t-name').fill('Pim Tester')
    await page.locator('#t-email').fill('pim@example.com')
    await page.locator('#t-type').selectOption('COMPLAINT')
    await page.locator('#t-updates').selectOption('no')
    await page.locator('#t-message').fill('The music upstairs is too loud on Fridays.')
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
    await page.goto('/contact/tips')
    await page.locator('#t-name').fill('Bot')
    await page.locator('#t-email').fill('bot@example.com')
    await page.locator('#t-message').fill('spam')
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
