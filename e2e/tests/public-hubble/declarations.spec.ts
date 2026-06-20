import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

// Minimal valid-enough PDF bytes; the backend checks the content type, not the contents.
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8')

test.describe('Hubble e-declaration form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a declaration emails finance with the receipt attached', async ({ page, request }, testInfo) => {
    await page.goto('/contact/declarations')
    await expect(page.getByRole('heading', { name: 'Online Declarations' })).toBeVisible()

    await page.locator('#d-name').fill('Sven Rooijakkers')
    await page.locator('#d-email').fill('sven@example.com')
    await page.locator('#d-iban').fill('NL70 TRIO 0338 5890 15')
    await page.locator('#d-date').fill('2026-06-18')
    await page.locator('#d-amount').fill('150,04')
    await page.locator('#d-cat').selectOption('Other')
    await page.locator('#d-desc').fill('SVH Exam')
    await page.locator('#d-file').setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: PDF })
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Declaration submitted' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-declaration-sent')

    const mail = await waitForMessageTo(request, 'finance@hubble.cafe')
    expect(mail.subject).toBe('New E-Declaration from Sven Rooijakkers')
    expect(mail.text).toContain('Amount in Euros: 150.04')
    expect(mail.text).toContain('IBAN: NL70TRIO033858901') // normalised (spaces removed, upper-cased)
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].contentType).toContain('application/pdf')
  })
})
