import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import {
  inDays, resetBackend, fakeAuroraPosterRequests, setFakeAuroraPosterMode,
} from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'
import { HubbleScreensForm, PNG } from '../../pages/HubbleScreensForm'

const ANKE = { name: 'Anke Woldman', association: 'Doppio', email: 'anke@example.com' }

test.describe('Hubble poster screens form', () => {
  test.beforeEach(async ({ request }) => {
    // Also puts the fake Aurora back to accepting, with no recorded requests.
    await resetBackend(request)
    await clearMailpit(request)
  })

  test('a request goes to Aurora for review and screens get a notice', async ({ page, request }, testInfo) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    // The slide-guide example image from the original site is shown.
    await expect(page.locator('figure img')).toBeVisible()
    await expect(page.getByText('Maximum file size: 20 MB')).toBeVisible()
    // Hubble and Meteor share the same screens, so there is no cafe to choose.
    await expect(page.locator('#s-cafe')).toHaveCount(0)

    await form.fill({
      ...ANKE, dates: { start: inDays(2), end: inDays(16) }, hexColor: '#FFF200', message: 'For our borrel',
    })
    await form.send()

    await expect(form.sentHeading()).toBeVisible()
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

  test('the clock colour is previewed and can be picked instead of typed', async ({ page, request }, testInfo) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    // Nothing entered means the screens use white.
    await expect(page.locator('#s-hex')).toHaveAttribute('placeholder', '#FFFFFF')
    await expect(form.colourSwatch()).toHaveAttribute('data-colour', '#FFFFFF')

    await page.locator('#s-hex').fill('#E4007C')
    await expect(form.colourSwatch()).toHaveAttribute('data-colour', '#E4007C')

    const picked = await form.pickColour(0.9, 0.2)
    expect(picked).toMatch(/^#[0-9A-F]{6}$/)
    expect(picked).not.toBe('#E4007C')
    await expect(form.colourSwatch()).toHaveAttribute('data-colour', picked)
    await captureScreenshot(testInfo, page, 'hubble-screen-colour-picker')

    // A click elsewhere closes the picker and keeps the colour.
    await page.getByRole('heading', { name: 'Hubble Poster Screens' }).click()
    await expect(form.colourPicker()).toHaveCount(0)

    await form.fill(ANKE)
    await form.send()
    await expect(form.sentHeading()).toBeVisible()
    const [posterRequest] = await fakeAuroraPosterRequests(request)
    expect(posterRequest.accentColor).toBe(picked)
  })

  test('a permanent poster needs no dates and reaches Aurora without them', async ({ page, request }) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill(ANKE)
    await form.send()

    await expect(form.sentHeading()).toBeVisible()
    const [posterRequest] = await fakeAuroraPosterRequests(request)
    expect(posterRequest).toMatchObject({ name: 'Doppio: permanent', startDate: null, expirationDate: null })
    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.text).toContain('Permanent association poster')
  })

  test('shows that the poster is being checked while Aurora takes its time', async ({ page, request }, testInfo) => {
    await setFakeAuroraPosterMode(request, 'SLOW')
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill(ANKE)
    await form.send()

    await expect(page.getByRole('status').filter({ hasText: 'Checking your poster…' })).toBeVisible()
    await expect(page.getByText('This can take up to half a minute.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    await captureScreenshot(testInfo, page, 'hubble-screen-checking')

    await expect(form.sentHeading()).toBeVisible()
    await expect(form.progressBar()).toHaveCount(0)
    expect(await fakeAuroraPosterRequests(request)).toHaveLength(1)
  })

  test('when Aurora is down the poster is emailed to screens instead', async ({ page, request }) => {
    await setFakeAuroraPosterMode(request, 'DOWN')
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill(ANKE)
    await form.send()

    // The requester cannot tell the difference: the request still reached the team.
    await expect(form.sentHeading()).toBeVisible()
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
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill(ANKE)
    await form.send()

    await expect(form.error(/We could not read your poster/)).toBeVisible()
    await expect(form.sentHeading()).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send request' })).toBeEnabled()
    await expectNoMessageTo(request, 'screens@hubble.cafe')
  })

  test('end date before start date is rejected with a message', async ({ page }) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill({ ...ANKE, dates: { start: inDays(16), end: inDays(2) } })
    await form.send()

    await expect(form.error(/end date must be on or after/i)).toBeVisible()
    await expect(form.sentHeading()).toHaveCount(0)
  })

  test('a honeypot-filled submission is silently dropped (no email)', async ({ page, request }) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill({ name: 'Bot', association: 'Spam', email: 'bot@example.com', dates: { start: inDays(2), end: inDays(4) } })
    // Fill the hidden, React-controlled honeypot the way a bot scripting the DOM would.
    await page.locator('input[name="website"]').evaluate((el) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, 'http://spam.example')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await form.send()

    await expect(form.sentHeading()).toBeVisible()
    await expectNoMessageTo(request, 'screens@hubble.cafe')
    expect(await fakeAuroraPosterRequests(request)).toHaveLength(0)
  })
})
