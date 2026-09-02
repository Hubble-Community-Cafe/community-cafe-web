import { test, expect } from '@playwright/test'
import { clearMailpit, waitForMessageTo, expectNoMessageTo } from '../../fixtures/mailpit'
import { captureScreenshot } from '../../fixtures/evidence'
import { MeteorPublic } from '../../pages/MeteorPublic'

// Minimal valid-enough PDF bytes; the backend checks the content type, not the contents.
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8')

test.describe('Meteor e-declaration form', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request)
  })

  test('submitting a declaration emails the Meteor treasurer with the receipt attached', async ({ page, request }, testInfo) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoDeclarations()

    await page.locator('#d-name').fill('Nora Vermeer')
    await page.locator('#d-email').fill('nora@example.com')
    await page.locator('#d-iban').fill('NL70 TRIO 0338 5890 15')
    await page.locator('#d-date').fill('2026-06-18')
    await page.locator('#d-amount').fill('40,00')
    await page.locator('#d-cat').selectOption('Bar Costs')
    await page.locator('#d-desc').fill('Ice for the terrace bar')
    await page.locator('#d-file').setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: PDF })
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('heading', { name: 'Declaration submitted' })).toBeVisible()
    await captureScreenshot(testInfo, page, 'meteor-declaration-sent')

    const mail = await waitForMessageTo(request, 'finance@meteor.cafe')
    expect(mail.from).toBe('noreply@meteor.cafe')
    expect(mail.subject).toBe('New E-Declaration from Nora Vermeer')
    expect(mail.text).toContain('New E-Declaration from the Meteor website')
    expect(mail.text).toContain('Amount in Euros: 40.00')
    expect(mail.text).toContain('IBAN: NL70TRIO033858901') // normalised (spaces removed, upper-cased)
    expect(mail.attachments).toHaveLength(1)
    expect(mail.attachments[0].contentType).toContain('application/pdf')

    // Hubble and Meteor are separate companies: nothing may reach the Hubble treasurer.
    await expectNoMessageTo(request, 'finance@hubble.cafe')

    // The submitter also receives a confirmation (no receipt echoed back), signed as Meteor.
    const ack = await waitForMessageTo(request, 'nora@example.com')
    expect(ack.from).toBe('noreply@meteor.cafe')
    expect(ack.subject).toBe('We received your declaration')
    expect(ack.text).toContain('Meteor Community Cafe')
    expect(ack.attachments).toHaveLength(0)
  })

  test('a declaration without a receipt is rejected client-side', async ({ page, request }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoDeclarations()

    await page.locator('#d-name').fill('No Receipt')
    await page.locator('#d-email').fill('x@example.com')
    await page.locator('#d-iban').fill('NL70TRIO0338589015')
    await page.locator('#d-date').fill('2026-06-18')
    await page.locator('#d-amount').fill('10,00')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByRole('alert')).toContainText('Please attach the receipt')
    await expect(page.getByRole('heading', { name: 'Declaration submitted' })).toHaveCount(0)
    await expectNoMessageTo(request, 'finance@meteor.cafe')
  })
})
