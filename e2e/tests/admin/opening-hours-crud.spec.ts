import { test, expect } from '@playwright/test'
import { inDays, resetBackend, seedHoursOverride, seedWeeklyHours, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL, METEOR_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

test.describe('Admin opening hours CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an editor sets Monday hours that flow to the public footer', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/hours') // defaults to the Hubble bar

    const row = page.getByRole('row').filter({ hasText: 'Monday' })
    await row.getByRole('button', { name: 'Set hours' }).click()
    const times = row.locator('input[type="time"]')
    await times.nth(0).fill('11:00') // open
    await times.nth(1).fill('23:00') // close
    await row.getByRole('button', { name: 'Save' }).click()

    await expect(row.getByText('11:00 – 23:00')).toBeVisible()

    // The CMS-driven footer on the public site now reflects it.
    await page.goto(`${HUBBLE_BASE_URL}/`)
    await expect(page.locator('footer').getByText('11:00 to 23:00')).toBeVisible()
  })

  test('an editor edits an override into a partial opening with times, shown on both sites', async ({ page, request }) => {
    for (const bar of ['HUBBLE', 'METEOR'] as const) {
      for (const day of ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']) {
        await seedWeeklyHours(request, bar, day, { open: '11:00', close: '23:00' })
      }
    }
    const date = inDays(12)
    await seedHoursOverride(request, 'HUBBLE', { date, closed: true, note: 'LED Partyy' })

    const admin = new AdminApp(page)
    await admin.goto('/hours')
    await page.getByRole('button', { name: `Edit the override for ${date}` }).click()
    const edit = page.getByRole('form', { name: `Edit the override for ${date}` })
    await edit.getByLabel('Status').selectOption('open')
    await edit.getByLabel('Opens (optional)').fill('20:00')
    await edit.getByLabel('Closes (optional)').fill('02:00')
    await edit.getByLabel('Note (optional)').fill('LED Party')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Open 20:00 to 02:00')).toBeVisible()

    // Only one time is refused with a message.
    await page.getByRole('button', { name: 'Meteor' }).click()
    // Wait for Meteor's overrides to load: the form is rebuilt for the other bar.
    await expect(page.getByText('No upcoming overrides.')).toBeVisible()
    const add = page.getByRole('form', { name: 'Add an override' })
    await add.getByLabel('Date').fill(date)
    await add.getByLabel('Status').selectOption('open')
    await add.getByLabel('Opens (optional)').fill('21:00')
    await add.getByRole('button', { name: 'Add' }).click()
    await expect(add.getByRole('alert')).toContainText('Enter both an opening and a closing time')
    await add.getByLabel('Closes (optional)').fill('01:00')
    await add.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('Open 21:00 to 01:00')).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/`)
    await expect(page.getByText('Special dates')).toBeVisible()
    await expect(page.getByText('(LED Party)')).toBeVisible()
    await expect(page.getByText('20:00 – 02:00')).toBeVisible()

    await page.goto(`${METEOR_BASE_URL}/`)
    await expect(page.getByText('21:00 to 01:00')).toBeVisible()
  })
})
