import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { inDays, resetBackend, fakeAuroraPosterRequests, setFakeAuroraPosterMode } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'
import { HubbleScreensForm } from '../../pages/HubbleScreensForm'

test.describe('Hubble poster screens form on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await clearMailpit(request)
  })

  test('requests a poster from a phone, with the waiting state in view', async ({ page, request }, testInfo) => {
    await setFakeAuroraPosterMode(request, 'SLOW')
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill({
      name: 'Mobile Pim', association: 'Doppio', email: 'mobile.pim@example.com',
      dates: { start: inDays(2), end: inDays(9) },
    })
    await form.send()

    // The progress sits next to the button the phone user just tapped.
    const status = page.getByRole('status').filter({ hasText: 'Checking your poster…' })
    await expect(status).toBeInViewport()
    await captureScreenshot(testInfo, page, 'mobile-hubble-screen-checking')

    await expect(form.sentHeading()).toBeVisible()
    expect(await fakeAuroraPosterRequests(request)).toHaveLength(1)
    const mail = await waitForMessageTo(request, 'screens@hubble.cafe')
    expect(mail.subject).toBe('Poster request from Mobile Pim - Doppio: review in Aurora')

    // The page does not scroll sideways at phone width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('the colour picker fits on a phone', async ({ page }, testInfo) => {
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.colourSwatch().scrollIntoViewIfNeeded()
    const picked = await form.pickColour(0.8, 0.3)
    expect(picked).toMatch(/^#[0-9A-F]{6}$/)
    await expect(form.colourPicker()).toBeInViewport({ ratio: 1 })
    await captureScreenshot(testInfo, page, 'mobile-hubble-screen-colour-picker')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('shows why a poster was refused on a phone', async ({ page, request }) => {
    await setFakeAuroraPosterMode(request, 'REJECT_FILE')
    const form = new HubbleScreensForm(page)
    await form.goto()
    await form.fill({ name: 'Mobile Pim', association: 'Doppio', email: 'mobile.pim@example.com' })
    await form.send()

    await expect(form.error(/We could not read your poster/)).toBeInViewport()
  })
})
