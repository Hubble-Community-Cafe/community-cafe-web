import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

/**
 * Editing several menu items at once: a whole section usually shares a price, and re-typing it per
 * item was the slowest thing in the CMS. Moving a selection also gives the admin its only way to
 * relocate a mis-filed item, since the item form has no category selector.
 */
test.describe('Admin menu bulk editing', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  async function seedBar(request: Parameters<typeof seedMenuCategory>[0]) {
    const tab = await seedMenuCategory(request, { name: 'E2E Drinks', bar: 'HUBBLE' })
    const cocktails = await seedMenuCategory(request, { name: 'E2E Cocktails', bar: 'HUBBLE', parentId: tab.id })
    const beers = await seedMenuCategory(request, { name: 'E2E Beers', bar: 'HUBBLE', parentId: tab.id })
    await seedMenuItem(request, beers.id, { name: 'E2E Pils', regularPrice: 3 })
    for (const name of ['E2E Mojito', 'E2E Negroni', 'E2E Daiquiri']) {
      await seedMenuItem(request, cocktails.id, { name, regularPrice: 7, studentPrice: 6 })
    }
    return { tab, cocktails, beers }
  }

  async function openCocktails(admin: AdminApp, page: import('@playwright/test').Page) {
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()
    await expect(admin.itemCheckbox('E2E Mojito')).toBeVisible()
  }

  test('one price is applied to a whole section and reaches the public menu', async ({ page, request }) => {
    await seedBar(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.selectAllItems('E2E Cocktails').click()
    await expect(admin.selectionCount()).toHaveText('3 items selected')

    await page.getByRole('button', { name: 'Set price' }).click()
    await page.getByLabel(/Regular price/).fill('7.50')
    await page.getByRole('button', { name: /Apply to 3 items/ }).click()

    // The selection clears once it lands, which is how the bar reports success.
    await expect(admin.selectionCount()).toHaveCount(0)
    await expect(page.getByText('€7.50 / €6.00')).toHaveCount(3)

    // The public site prints prices Dutch style, regular and student in one string.
    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    // The student price was left out of the request, so it has to come through untouched.
    await expect(page.getByText('€7,50/€6,00')).toHaveCount(3)
  })

  test('only the picked items change price', async ({ page, request }) => {
    await seedBar(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.itemCheckbox('E2E Mojito').click()
    await expect(admin.selectionCount()).toHaveText('1 item selected')

    await page.getByRole('button', { name: 'Set price' }).click()
    await page.getByLabel(/Regular price/).fill('9.00')
    await page.getByRole('button', { name: /Apply to 1 item/ }).click()

    await expect(admin.selectionCount()).toHaveCount(0)
    await expect(page.getByText('€9.00 / €6.00')).toHaveCount(1)
    await expect(page.getByText('€7.00 / €6.00')).toHaveCount(2)
  })

  test('the student price can be removed from a selection', async ({ page, request }) => {
    await seedBar(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.selectAllItems('E2E Cocktails').click()
    await page.getByRole('button', { name: 'Set price' }).click()
    await page.getByLabel(/Remove the TU\/e student price/).click()
    await page.getByRole('button', { name: /Apply to 3 items/ }).click()

    await expect(admin.selectionCount()).toHaveCount(0)
    await expect(page.getByText('€7.00', { exact: true })).toHaveCount(3)
    await expect(page.getByText('/ €6.00')).toHaveCount(0)
  })

  test('a selection can be moved to another sub-heading', async ({ page, request }) => {
    await seedBar(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.itemCheckbox('E2E Negroni').click()
    await admin.itemCheckbox('E2E Daiquiri').click()
    await expect(admin.selectionCount()).toHaveText('2 items selected')

    await page.getByRole('button', { name: 'Move to' }).click()
    await page.getByLabel('Move to sub-category').selectOption({ label: 'E2E Beers' })
    await page.getByRole('button', { name: /Move 2 items/ }).click()

    // They leave the open section...
    await expect.poll(() => admin.itemOrder()).toEqual(['E2E Mojito'])

    // ...and arrive after what was already in the target, in the order they were listed.
    await page.getByRole('button', { name: /^E2E Beers/ }).click()
    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Pils', 'E2E Negroni', 'E2E Daiquiri'])
  })

  /** The current section is not a destination, so the picker must not offer it. */
  test('the move picker excludes the section being edited', async ({ page, request }) => {
    await seedBar(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.itemCheckbox('E2E Mojito').click()
    await page.getByRole('button', { name: 'Move to' }).click()

    const options = page.getByLabel('Move to sub-category').getByRole('option')
    await expect(options.filter({ hasText: 'E2E Beers' })).toHaveCount(1)
    await expect(options.filter({ hasText: 'E2E Cocktails' })).toHaveCount(0)
  })

  test('a read-only viewer gets no checkboxes and no bulk bar', async ({ page, request }) => {
    await seedBar(request)
    await setUiRole(request, 'VIEWER')

    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()

    await expect(page.getByText('E2E Mojito')).toBeVisible()
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Set price' })).toHaveCount(0)
  })
})
