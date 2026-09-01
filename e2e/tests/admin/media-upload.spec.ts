import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'

/** A JPEG of a chosen size: real header bytes, padded out to length. */
const jpegOfSize = (bytes: number): Buffer => {
  const buffer = Buffer.alloc(bytes, 0)
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(buffer)
  return buffer
}

const MB = 1024 * 1024

test.describe('Admin media uploads', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an oversize image is refused in plain language, before any upload happens', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/media')
    await expect(page.getByRole('heading', { name: 'Upload image' })).toBeVisible()

    let uploadAttempted = false
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/admin/media')) uploadAttempted = true
    })

    await page.locator('input[type="file"]').setInputFiles({
      name: 'way-too-big.jpg',
      mimeType: 'image/jpeg',
      buffer: jpegOfSize(12 * MB),
    })

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('"way-too-big.jpg" is 12.0 MB, over the 10 MB limit.')
    await expect(alert).toContainText('Please resize or compress the image and try again.')
    await expect(alert).not.toContainText('413')
    expect(uploadAttempted).toBe(false)
  })

  test('an image within the limit uploads and lands in the library', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/media')
    await expect(page.getByRole('heading', { name: 'Upload image' })).toBeVisible()

    await page.getByPlaceholder('Describe the image for screen readers').fill('E2E test image')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'small.jpg',
      mimeType: 'image/jpeg',
      buffer: jpegOfSize(64 * 1024),
    })

    await expect(page.getByText('E2E test image')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
