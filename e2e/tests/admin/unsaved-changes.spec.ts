import { test, expect } from '@playwright/test'
import { inDays, resetBackend, seedEvent, setUiRole } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Admin unsaved changes', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
    await seedEvent(request, { bar: 'HUBBLE', title: 'Pub quiz', date: inDays(7) })
  })

  test('leaving an edited event asks first; "Keep editing" keeps the input, "Discard changes" leaves', async ({ page }, testInfo) => {
    const admin = new AdminApp(page)
    await admin.goto('/events')
    await page.getByRole('button', { name: 'Edit Pub quiz' }).click()
    const title = page.locator('form').getByPlaceholder('Quiz Night')
    await title.fill('Pub quiz XL')

    await admin.navLink('Menu').click()
    await expect(admin.unsavedChangesDialog()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep editing' })).toBeFocused()
    await captureScreenshot(testInfo, page, 'unsaved-changes-dialog')

    await page.getByRole('button', { name: 'Keep editing' }).click()
    await expect(admin.unsavedChangesDialog()).toBeHidden()
    await expect(page).toHaveURL(/\/events$/)
    await expect(title).toHaveValue('Pub quiz XL')

    await admin.navLink('Menu').click()
    await page.getByRole('button', { name: 'Discard changes' }).click()
    await expect(page).toHaveURL(/\/menu$/)
  })

  test('an opened but unchanged form does not get in the way', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/events')
    await page.getByRole('button', { name: 'Edit Pub quiz' }).click()

    await admin.navLink('Menu').click()
    await expect(page).toHaveURL(/\/menu$/)
    await expect(admin.unsavedChangesDialog()).toHaveCount(0)
  })

  test('closing the tab with unsaved input shows the browser warning', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/events')
    await page.getByRole('button', { name: 'Edit Pub quiz' }).click()
    await page.locator('form').getByPlaceholder('Quiz Night').fill('Pub quiz XL')

    const dialog = page.waitForEvent('dialog')
    await page.close({ runBeforeUnload: true })
    const warning = await dialog
    expect(warning.type()).toBe('beforeunload')
    await warning.dismiss()
  })
})
