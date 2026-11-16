import { test, expect, type Page } from '@playwright/test'

/**
 * The desktop menu's dropdowns used to open on mouse hover or focus only. An iPad in landscape gets
 * that desktop menu but cannot hover, and Safari does not focus a tapped button, so its dropdowns
 * could not be opened at all. Now a tap, a click or Enter/Space opens one and Escape closes it.
 */
const community = (page: Page) =>
  page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Community' })
const panel = async (page: Page) =>
  page.locator(`#${await community(page).getAttribute('aria-controls')}`)

test.describe('Hubble desktop dropdowns on a touch screen', () => {
  test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true })

  test('a tap opens a dropdown, and choosing a page closes it', async ({ page }) => {
    await page.goto('/')
    await expect(community(page)).toHaveAttribute('aria-expanded', 'false')

    await community(page).tap()
    await expect(community(page)).toHaveAttribute('aria-expanded', 'true')
    const menu = await panel(page)
    await expect(menu.getByRole('link', { name: 'Associations' })).toBeVisible()

    await menu.getByRole('link', { name: 'Associations' }).tap()
    await expect(page).toHaveURL(new RegExp('/community/associations$'))
    await expect(community(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('a tap elsewhere closes it', async ({ page }) => {
    await page.goto('/')
    await community(page).tap()
    await expect(community(page)).toHaveAttribute('aria-expanded', 'true')

    await page.locator('main').tap({ position: { x: 10, y: 10 } })
    await expect(community(page)).toHaveAttribute('aria-expanded', 'false')
    await expect((await panel(page)).getByRole('link', { name: 'Associations' })).toBeHidden()
  })
})

test('Hubble desktop dropdowns work from the keyboard', async ({ page }) => {
  await page.goto('/')
  await community(page).focus()
  await page.keyboard.press('Enter')
  await expect(community(page)).toHaveAttribute('aria-expanded', 'true')
  await expect((await panel(page)).getByRole('link', { name: 'Associations' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(community(page)).toHaveAttribute('aria-expanded', 'false')
  await expect(community(page)).toBeFocused()
})
