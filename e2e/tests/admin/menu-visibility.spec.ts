import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

/**
 * Temporarily taking menu content off the public site. The important claim is that hiding is
 * non-destructive: hiding a tab masks everything under it, and putting the tab back restores
 * exactly the items that were visible before rather than un-hiding everything.
 */
test.describe('Admin menu visibility toggles', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('hiding an item, then its whole tab, and restoring keeps per-item state', async ({ page }) => {
    const admin = new AdminApp(page)
    await admin.goto('/menu') // defaults to the Hubble bar

    // Build tab > sub-category > two items.
    await admin.addButton('Add tab').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Taps')
    await page.getByRole('button', { name: 'Save' }).click()
    const tab = page.getByRole('button', { name: /^E2E Taps/ })
    await expect(tab).toBeVisible()

    await tab.click()
    await admin.addButton('Add sub-category').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Draught')
    await page.getByRole('button', { name: 'Save' }).click()
    const sub = page.getByRole('button', { name: /^E2E Draught/ })
    await expect(sub).toBeVisible()

    await sub.click()
    for (const [name, price] of [['E2E Pils', '3.00'], ['E2E Tripel', '4.50']]) {
      await admin.addButton('Add item').click()
      await page.getByLabel('Name', { exact: true }).fill(name)
      await page.getByLabel(/Regular price/).fill(price)
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText(name)).toBeVisible()
    }

    // Both live on the public menu.
    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText('E2E Pils')).toBeVisible()
    await expect(page.getByText('E2E Tripel')).toBeVisible()

    // Hide one item: the keg kicked.
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Taps/ }).click()
    await page.getByRole('button', { name: /^E2E Draught/ }).click()
    await page.getByRole('button', { name: 'Hide E2E Tripel from the site' }).click()
    await expect(page.getByRole('button', { name: 'Show E2E Tripel on the site' })).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText('E2E Pils')).toBeVisible()
    await expect(page.getByText('E2E Tripel')).toHaveCount(0)

    // Hide the whole tab: everything under it goes, with no empty heading left behind.
    await admin.goto('/menu')
    await page.getByRole('button', { name: 'Hide E2E Taps from the site' }).click()
    await expect(page.getByRole('button', { name: 'Show E2E Taps on the site' })).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText('E2E Pils')).toHaveCount(0)
    await expect(page.getByText('E2E Tripel')).toHaveCount(0)
    await expect(page.getByText('E2E Draught')).toHaveCount(0)

    // Put the tab back: the visible item returns, the hidden one stays hidden.
    await admin.goto('/menu')
    await page.getByRole('button', { name: 'Show E2E Taps on the site' }).click()
    await expect(page.getByRole('button', { name: 'Hide E2E Taps from the site' })).toBeVisible()

    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText('E2E Pils')).toBeVisible()
    await expect(page.getByText('E2E Tripel')).toHaveCount(0)
  })

  test('a read-only viewer sees the menu but gets no visibility toggles', async ({ page, request }) => {
    const admin = new AdminApp(page)

    // Create content as an editor first: reset leaves the menu empty, so asserting
    // "no toggles" on an empty page would pass for the wrong reason.
    await admin.goto('/menu')
    await admin.addButton('Add tab').click()
    await page.getByLabel('Name', { exact: true }).fill('E2E Viewer Tab')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: /^E2E Viewer Tab/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hide E2E Viewer Tab from the site' })).toBeVisible()

    await setUiRole(request, 'VIEWER')
    await admin.goto('/menu')

    // The tab is still listed, but read-only: no toggle, and no edit affordances.
    await expect(page.getByRole('button', { name: /^E2E Viewer Tab/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /from the site$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /on the site$/ })).toHaveCount(0)
  })
})
