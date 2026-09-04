import { test, expect } from '@playwright/test'
import { resetBackend, seedMenuCategory, seedMenuItem, setUiRole } from '../../fixtures/backend'
import { AdminApp } from '../../pages/AdminApp'

/**
 * Reordering the menu on a phone. Board members do bar shifts with a phone in hand, so this is the
 * case that decided the implementation: native HTML5 drag and drop does not fire on touch at all,
 * which is why the handles are pointer-event based and carry touch-action: none, without which the
 * browser scrolls the page instead of starting the drag.
 */
test.describe('Menu reordering on a phone', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await setUiRole(request, 'EDITOR')
  })

  test('an item can be dragged into a new position', async ({ page, request }) => {
    const tab = await seedMenuCategory(request, { name: 'E2E Drinks', bar: 'HUBBLE' })
    const sub = await seedMenuCategory(request, { name: 'E2E Cocktails', bar: 'HUBBLE', parentId: tab.id })
    for (const name of ['E2E Mojito', 'E2E Negroni', 'E2E Daiquiri']) {
      await seedMenuItem(request, sub.id, { name, regularPrice: 7 })
    }

    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()
    await expect(admin.dragHandle('E2E Mojito')).toBeVisible()

    // The handle is a full 44px target below the sm breakpoint, where the drag has to be pressed
    // and held precisely. At the desktop size of 28px it is an awkward thing to hit with a thumb.
    const box = await admin.dragHandle('E2E Mojito').boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)

    await admin.touchDragRowOnto('E2E Daiquiri', 'E2E Mojito')

    await expect
      .poll(() => admin.itemOrder())
      .toEqual(['E2E Daiquiri', 'E2E Mojito', 'E2E Negroni'])
  })

  test('the page does not scroll sideways at phone width', async ({ page, request }) => {
    const tab = await seedMenuCategory(request, { name: 'E2E Drinks', bar: 'HUBBLE' })
    const sub = await seedMenuCategory(request, { name: 'E2E Cocktails', bar: 'HUBBLE', parentId: tab.id })
    await seedMenuItem(request, sub.id, { name: 'E2E Espresso Martini', regularPrice: 7, studentPrice: 6 })

    const admin = new AdminApp(page)
    await admin.goto('/menu')
    await page.getByRole('button', { name: /^E2E Drinks/ }).click()
    await page.getByRole('button', { name: /^E2E Cocktails/ }).click()
    await expect(admin.dragHandle('E2E Espresso Martini')).toBeVisible()

    // The row gained a checkbox and a handle on top of its existing buttons, which is where a
    // narrow layout would start overflowing.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflows).toBe(false)
  })
})
