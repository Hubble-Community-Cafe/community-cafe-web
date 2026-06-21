import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { inDays } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

// Minimal 1x1 PNG, enough for the content-type/size checks.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/QGyAAAAAElFTkSuQmCC',
  'base64',
)

test.describe('Hubble poster screens form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a request emails screens with the poster attached', async ({ page, request }, testInfo) => {
    await page.goto('/contact/screens')
    await expect(page.getByRole('heading', { name: 'Hubble Poster Screens' })).toBeVisible()
    // The slide-guide example image from the original site is shown.
    await expect(page.locator('figure img')).toBeVisible()

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.locator('#s-cafe').selectOption('BOTH')
    await page.locator('#s-start').fill(inDays(2))
    await page.locator('#s-end').fill(inDays(16))
    await page.locator('#s-hex').fill('#FFF200')
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-screen-sent')

    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('Screen Request from Anke Woldman - Doppio')
    expect(mail.text).toContain('Association: Doppio')
    expect(mail.text).toContain('Hex: #FFF200')
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].contentType).toContain('image/png')

    // The submitter also receives a confirmation (no attachment echoed back).
    const ack = await waitForMessageTo(request, 'anke@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your poster screen request')
    expect(ack.text).toContain('Doppio')
    expect(ack.attachments).toHaveLength(0)
  })

  test('a permanent poster needs no dates and is flagged as general', async ({ page, request }) => {
    await page.goto('/contact/screens')

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.locator('#s-cafe').selectOption('BOTH')
    await page.getByRole('checkbox', { name: /permanent poster/i }).check()
    // Dates are now disabled; submit without them.
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.text).toContain('Permanent association poster')
  })

  test('end date before start date is rejected with a message', async ({ page }) => {
    await page.goto('/contact/screens')
    await page.locator('#s-name').fill('Anke')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.locator('#s-start').fill(inDays(16))
    await page.locator('#s-end').fill(inDays(2))
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    // Scope to our form error (the ALTCHA widget also renders a role="alert" popover).
    await expect(page.getByText(/end date must be on or after/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Request received' })).toHaveCount(0)
  })

  test('a honeypot-filled submission is silently dropped (no email)', async ({ page, request }) => {
    await page.goto('/contact/screens')
    await page.locator('#s-name').fill('Bot')
    await page.locator('#s-assoc').fill('Spam')
    await page.locator('#s-email').fill('bot@example.com')
    await page.locator('#s-cafe').selectOption('HUBBLE')
    await page.locator('#s-start').fill(inDays(2))
    await page.locator('#s-end').fill(inDays(4))
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    // Fill the hidden, React-controlled honeypot the way a bot scripting the DOM would.
    await page.locator('input[name="website"]').evaluate((el) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, 'http://spam.example')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    await expectNoMessageTo(request, 'screens@hubble.cafe')
  })
})
