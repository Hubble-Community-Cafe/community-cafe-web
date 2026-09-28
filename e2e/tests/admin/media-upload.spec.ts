import { test, expect } from '@playwright/test'
import { BACKEND_URL } from '../../playwright.config'
import { inDays, resetBackend, SEEDER_OID, seedEvent, seedUser, setUiRole } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'

/** A JPEG of a chosen size: real header bytes, padded out to length. Only for the client-side size check. */
const jpegOfSize = (bytes: number): Buffer => {
  const buffer = Buffer.alloc(bytes, 0)
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(buffer)
  return buffer
}

/** A real 8x8 JPEG. The backend parses uploads to strip metadata, so padded header bytes are refused. */
const SMALL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDnfFHij/hJPsn+h/Zvs+//AJa7927b7DH3aKKK7MNhqWFpKjRVorZavd36njVas603UqO7Z//Z',
  'base64',
)

/** A real JPEG padded to about a chosen size with comment segments (which the backend strips). */
const realJpegOfSize = (bytes: number): Buffer => {
  const parts: Buffer[] = [SMALL_JPEG.subarray(0, 2)]
  for (let remaining = bytes - SMALL_JPEG.length; remaining > 4; ) {
    const payload = Math.min(remaining - 4, 65533)
    const header = Buffer.from([0xff, 0xfe, (payload + 2) >> 8, (payload + 2) & 0xff])
    parts.push(header, Buffer.alloc(payload, 0x20))
    remaining -= payload + 4
  }
  parts.push(SMALL_JPEG.subarray(2))
  return Buffer.concat(parts)
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
      buffer: realJpegOfSize(64 * 1024),
    })

    await expect(page.getByText('E2E test image')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('a file that is not really an image is refused in plain language', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/media')
    await expect(page.getByRole('heading', { name: 'Upload image' })).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'notes.png',
      mimeType: 'image/png',
      buffer: Buffer.from('These are meeting notes, not a picture.'),
    })

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('This file is not a JPEG, PNG, WebP or GIF image.')
  })

  test('an image an event still shows cannot be deleted, and the admin says which event', async ({ page, request }) => {
    // Upload two images through the API; the event gets the first one.
    await seedUser(request, { oid: SEEDER_OID, role: 'ADMIN' })
    const upload = async (name: string) => {
      const res = await request.post(`${BACKEND_URL}/api/admin/media`, {
        headers: { 'X-Test-Oid': SEEDER_OID },
        multipart: { file: { name, mimeType: 'image/jpeg', buffer: realJpegOfSize(4 * 1024) } },
      })
      return (await res.json()) as { id: number; filename: string }
    }
    const used = await upload('used.jpg')
    const unused = await upload('unused.jpg')
    const event = await seedEvent(request, { bar: 'HUBBLE', title: 'Pub quiz', date: inDays(7) })
    await request.put(`${BACKEND_URL}/api/admin/events/${event.id}`, {
      headers: { 'X-Test-Oid': SEEDER_OID },
      data: { bar: 'HUBBLE', title: 'Pub quiz', date: inDays(7), startTime: null, price: null, description: null,
        subscribeLink: null, imageId: used.id, published: true },
    })

    page.on('dialog', (dialog) => dialog.accept())
    const admin = new AdminApp(page)
    await admin.goto('/media')
    const card = (filename: string) => page.locator('div.group').filter({ hasText: filename })

    await card(used.filename).hover()
    await card(used.filename).getByTitle('Delete').click()
    await expect(page.getByRole('alert')).toContainText(
      "This image is still used by the event 'Pub quiz'. Choose another image there first.")
    await expect(card(used.filename)).toBeVisible()

    await card(unused.filename).hover()
    await card(unused.filename).getByTitle('Delete').click()
    await expect(card(unused.filename)).toHaveCount(0)
    const images = await request.get(`${BACKEND_URL}/api/admin/media`, { headers: { 'X-Test-Oid': SEEDER_OID } })
    expect(((await images.json()) as { filename: string }[]).map((m) => m.filename)).toEqual([used.filename])
  })
})
