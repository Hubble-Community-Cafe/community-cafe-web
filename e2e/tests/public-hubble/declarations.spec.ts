import { test, expect } from '@playwright/test'
import { DeclarationForm } from '../../pages/PublicForms'
import { MINIMAL_PDF } from '../../fixtures/files'
import { clearMailpit, waitForMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble e-declaration form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a declaration emails finance with the receipt attached', async ({ page, request }, testInfo) => {

    const declaration = new DeclarationForm(page)
    await page.goto('/contact/declarations')
    await expect(page.getByRole('heading', { name: 'Online Declarations' })).toBeVisible()

    await declaration.fullName.fill('Sven Rooijakkers')
    await declaration.email.fill('sven@example.com')
    await declaration.iban.fill('NL70 TRIO 0338 5890 15')
    await declaration.dateOfPurchase.fill('2026-06-18')
    await declaration.amount.fill('150,04')
    await declaration.category.selectOption('Other')
    await declaration.description.fill('SVH Exam')
    await declaration.receipt.setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: MINIMAL_PDF })
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Declaration submitted' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'hubble-declaration-sent')

    const mail = await waitForMessageTo(request, 'finance@hubble.cafe')
    expect(mail.from).toBe('noreply@hubble.cafe')
    expect(mail.subject).toBe('New E-Declaration from Sven Rooijakkers')
    expect(mail.text).toContain('Amount in Euros: 150.04')
    expect(mail.text).toContain('IBAN: NL70TRIO033858901') // normalised (spaces removed, upper-cased)
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].contentType).toContain('application/pdf')

    // The submitter also receives a confirmation (no receipt echoed back).
    const ack = await waitForMessageTo(request, 'sven@example.com')
    expect(ack.from).toBe('noreply@hubble.cafe')
    expect(ack.subject).toBe('We received your declaration')
    expect(ack.text).toContain('Amount in euros: 150.04')
    expect(ack.attachments).toHaveLength(0)
  })
})
