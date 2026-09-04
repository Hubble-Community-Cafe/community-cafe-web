import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem, setUiRole } from '../../fixtures/backend'
import { HUBBLE_BASE_URL } from '../../playwright.config'
import { AdminApp } from '../../pages/AdminApp'

/**
 * Putting the menu in order by dragging, which replaced a sort-order number field that stopped
 * being usable past a handful of rows. The claim worth testing end to end is that the order an
 * editor drops rows into is the order the public site serves, since the CMS and the site read the
 * same sort order from opposite ends.
 */
test.describe('Admin menu reordering', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  /** Tab > sub-heading > three items, seeded through the API so the spec starts at the drag. */
  async function seedCocktails(request: Parameters<typeof seedMenuCategory>[0]) {
    const tab = await seedMenuCategory(request, { name: 'E2E Drinks', bar: 'HUBBLE' })
    const sub = await seedMenuCategory(request, { name: 'E2E Cocktails', bar: 'HUBBLE', parentId: tab.id })
    for (const name of ['E2E Mojito', 'E2E Negroni', 'E2E Daiquiri']) {
      await seedMenuItem(request, sub.id, { name, regularPrice: 7 })
    }
    return { tab, sub }
  }

  async function openCocktails(admin: AdminApp, page: import('@playwright/test').Page) {
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()
    await expect(admin.dragHandle('E2E Mojito')).toBeVisible()
  }

  test('dragging an item to the top reorders it on the public menu too', async ({ page, request }) => {
    await seedCocktails(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    expect(await admin.itemOrder()).toEqual(['E2E Mojito', 'E2E Negroni', 'E2E Daiquiri'])

    await admin.dragRowOnto('E2E Daiquiri', 'E2E Mojito')
    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Daiquiri', 'E2E Mojito', 'E2E Negroni'])

    // Survives a reload, so the order was written rather than only shuffled in the browser.
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()
    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Daiquiri', 'E2E Mojito', 'E2E Negroni'])

    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    const onSite = page.getByText(/^E2E (Mojito|Negroni|Daiquiri)$/)
    await expect(onSite).toHaveText(['E2E Daiquiri', 'E2E Mojito', 'E2E Negroni'])
  })

  /** The handle is a button for a reason: reordering has to work without a pointer. */
  test('an item can be reordered from the keyboard', async ({ page, request }) => {
    await seedCocktails(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.reorderWithKeyboard('E2E Mojito', 'ArrowDown', 2)

    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Negroni', 'E2E Daiquiri', 'E2E Mojito'])
  })

  test('escape abandons a keyboard reorder', async ({ page, request }) => {
    await seedCocktails(request)
    const admin = new AdminApp(page)
    await openCocktails(admin, page)

    await admin.dragHandle('E2E Mojito').focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Escape')

    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Mojito', 'E2E Negroni', 'E2E Daiquiri'])
  })

  test('sub-headings can be reordered within their tab', async ({ page, request }) => {
    const tab = await seedMenuCategory(request, { name: 'E2E Drinks', bar: 'HUBBLE' })
    for (const name of ['E2E Cocktails', 'E2E Beers']) {
      const sub = await seedMenuCategory(request, { name, bar: 'HUBBLE', parentId: tab.id })
      await seedMenuItem(request, sub.id, { name: `${name} item`, regularPrice: 4 })
    }

    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await expect(admin.dragHandle('E2E Beers')).toBeVisible()

    await admin.dragRowOnto('E2E Beers', 'E2E Cocktails')

    await page.goto(`${HUBBLE_BASE_URL}/cafe/menu`)
    await expect(page.getByText(/^E2E (Cocktails|Beers)$/)).toHaveText(['E2E Beers', 'E2E Cocktails'])
  })

  test('a read-only viewer gets no drag handles', async ({ page, request }) => {
    await seedCocktails(request)
    await setUiRole(request, 'VIEWER')

    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()

    await expect(page.getByText('E2E Mojito')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Reorder / })).toHaveCount(0)
  })
})
