import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble information form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a question emails the info list and confirms the submitter', async ({ page, request }, testInfo) => {
    await page.goto('/contact/information')
    await expect(page.getByRole('heading', { name: 'Information Form' })).toBeVisible()

    await page.locator('#i-name').fill('Tess Tester')
    await page.locator('#i-email').fill('tess@example.com')
    await page.locator('#i-phone').fill('+316 12345678')
    await page.locator('#i-message').fill('Could we host a borrel next month?')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-information-sent')

    const mail = await waitForMessageTo(request, 'info@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('Hubble information request from Tess Tester')
    expect(mail.text).toContain('borrel next month')

    const ack = await waitForMessageTo(request, 'tess@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your message')
  })
})
