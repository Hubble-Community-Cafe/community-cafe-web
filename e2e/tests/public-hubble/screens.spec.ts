import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import {
  inDays, resetBackend, fakeAuroraPosterRequests, setFakeAuroraPosterMode,
} from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

// Minimal 1x1 PNG, enough for the content-type/size checks.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/QGyAAAAAElFTkSuQmCC',
  'base64',
)

test.describe('Hubble poster screens form', () => {
  test.beforeEach(async ({ request }) => {
    // Also puts the fake Aurora back to accepting, with no recorded requests.
    await resetBackend(request)
    await clearMailpit(request)
  })

  test('a request goes to Aurora for review and screens get a notice', async ({ page, request }, testInfo) => {
    await page.goto('/contact/screens')
    await expect(page.getByRole('heading', { name: 'Hubble Poster Screens' })).toBeVisible()
    // The slide-guide example image from the original site is shown.
    await expect(page.locator('figure img')).toBeVisible()

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.locator('#s-start').fill(inDays(2))
    await page.locator('#s-end').fill(inDays(16))
    await page.locator('#s-hex').fill('#FFF200')
    await page.locator('#s-msg').fill('For our borrel')
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-screen-sent')

    const [posterRequest] = await fakeAuroraPosterRequests(request)
    expect(posterRequest).toMatchObject({
      requesterName: 'Anke Woldman',
      requesterEmail: 'anke@example.com',
      requesterAssociation: 'Doppio',
      message: 'For our borrel',
      name: `Doppio: ${inDays(2)} to ${inDays(16)}`,
      label: null,
      accentColor: '#FFF200',
      defaultTimeout: 30,
      fileName: 'poster.png',
      contentType: 'image/png',
      fileSize: PNG.length,
    })
    // Midnight in Amsterdam on the start day, until midnight after the end day.
    expect(posterRequest.startDate).toMatch(new RegExp(`^${inDays(2)}T00:00\\+0[12]:00$`))
    expect(posterRequest.expirationDate).toMatch(new RegExp(`^${inDays(17)}T00:00\\+0[12]:00$`))

    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('Poster request from Anke Woldman - Doppio: review in Aurora')
    expect(mail.text).toContain('waiting for review in Aurora')
    expect(mail.text).toContain('Association: Doppio')
    expect(mail.text).toContain('File: poster.png')
    expect(mail.attachments).toHaveLength(0)

    // The submitter also receives a confirmation (no attachment echoed back).
    const ack = await waitForMessageTo(request, 'anke@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your poster screen request')
    expect(ack.text).toContain('Doppio')
    expect(ack.attachments).toHaveLength(0)
  })

  test('a permanent poster needs no dates and reaches Aurora without them', async ({ page, request }) => {
    await page.goto('/contact/screens')

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.getByRole('checkbox', { name: /permanent poster/i }).check()
    // Dates are now disabled; submit without them.
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    const [posterRequest] = await fakeAuroraPosterRequests(request)
    expect(posterRequest).toMatchObject({ name: 'Doppio: permanent', startDate: null, expirationDate: null })
    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.text).toContain('Permanent association poster')
  })

  test('when Aurora is down the poster is emailed to screens instead', async ({ page, request }) => {
    await setFakeAuroraPosterMode(request, 'DOWN')
    await page.goto('/contact/screens')

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.getByRole('checkbox', { name: /permanent poster/i }).check()
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    // The requester cannot tell the difference: the request still reached the team.
    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    expect(await fakeAuroraPosterRequests(request)).toHaveLength(0)
    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.subject).toBe('Screen Request from Anke Woldman - Doppio')
    expect(mail.text).toContain('this request is NOT in')
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].contentType).toContain('image/png')
    await waitForMessageTo(request, 'anke@example.com')
  })

  test('a file Aurora cannot read is refused with a message the requester can act on', async ({ page, request }) => {
    await setFakeAuroraPosterMode(request, 'REJECT_FILE')
    await page.goto('/contact/screens')

    await page.locator('#s-name').fill('Anke Woldman')
    await page.locator('#s-assoc').fill('Doppio')
    await page.locator('#s-email').fill('anke@example.com')
    await page.getByRole('checkbox', { name: /permanent poster/i }).check()
    await page.locator('#s-file').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG })
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByText(/We could not read your poster/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Request received' })).toHaveCount(0)
    await expectNoMessageTo(request, 'screens@hubble.cafe')
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
    expect(await fakeAuroraPosterRequests(request)).toHaveLength(0)
  })
})
