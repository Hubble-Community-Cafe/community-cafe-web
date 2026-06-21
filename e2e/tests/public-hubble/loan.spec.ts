import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble loan equipment form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a loan request emails the loan list with pick-up/return details', async ({ page, request }, testInfo) => {
    await page.goto('/contact/loan-equipment')
    await expect(page.getByRole('heading', { name: 'Hubble Loan Equipment' })).toBeVisible()
    // The reference images open in an in-page modal (not a new tab).
    await page.getByRole('button', { name: 'cantus table' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img')).toHaveAttribute('src', '/images/loan/cantus-tables.jpeg')
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.locator('#l-name').fill('Lotte Tester')
    await page.locator('#l-assoc').fill('Doppio')
    await page.locator('#l-email').fill('lotte@example.com')
    await page.locator('#l-pdate').fill('2026-07-01')
    await page.locator('#l-ptime').fill('14:00')
    await page.locator('#l-rdate').fill('2026-07-03')
    await page.locator('#l-rtime').fill('12:00')
    await page.locator('#l-message').fill('Two cantus tables and the beer draft please.')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-loan-sent')

    const mail = await waitForMessageTo(request, 'loan@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('Hubble loan request from Lotte Tester - Doppio')
    expect(mail.text).toContain('Pick-up: 2026-07-01 at 14:00')
    expect(mail.text).toContain('Return: 2026-07-03 at 12:00')

    const ack = await waitForMessageTo(request, 'lotte@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your loan request')
    expect(ack.text).toContain('Doppio')
  })
})
