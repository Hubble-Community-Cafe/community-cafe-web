import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { AdminApp } from '../../pages/AdminApp'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { ADMIN_ROUTES, expectNoNewA11yViolations, scanRoutes, seedA11yContent } from '../../fixtures/a11y'

/**
 * WCAG 2.2 A/AA (axe) on every main page of the admin on desktop.
 * Violations that predate these checks are listed in fixtures/a11y-known-issues.ts; anything else fails.
 */
test('every page meets WCAG 2.2 AA, apart from the known issues', async ({ page, request }, testInfo) => {
  test.setTimeout(240_000)
  await resetBackend(request)
  await seedA11yContent(request)
  // ADMIN, so the admin-only pages render their real content.
  await setUiRole(request, 'ADMIN')

  await scanRoutes(page, testInfo, ADMIN_ROUTES)
})

test('keyboard: the first Tab shows "Skip to content", which moves focus to the page content', async ({ page, request }, testInfo) => {
  await resetBackend(request)
  await setUiRole(request, 'EDITOR')
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await expectNoNewA11yViolations(page, testInfo, 'skip link focused')

  await page.keyboard.press('Enter')
  await expect(page.locator('main#main-content')).toBeFocused()
  expect(new URL(page.url()).hash).toBe('')

  // Following a link moves focus to the new page instead of leaving it on the clicked link.
  await page.getByRole('navigation', { name: 'Admin' }).getByText('Menu', { exact: true }).click()
  await expect(page.locator('main#main-content')).toBeFocused()
})

/**
 * Every field in every admin form has a name a screen reader announces, and clicking a label puts
 * the cursor in its field. The page scan above never opens a form, so each one is opened here and
 * checked with axe's labelling rules only.
 */
test('every admin form names its fields', async ({ page, request }) => {
  test.setTimeout(120_000)
  await resetBackend(request)
  await seedA11yContent(request)
  await setUiRole(request, 'ADMIN')
  const admin = new AdminApp(page)

  const forms: { route: string; open: () => Promise<void> }[] = [
    { route: '/events', open: () => page.getByRole('button', { name: 'Add event' }).click() },
    { route: '/vacancies', open: () => page.getByRole('button', { name: 'Add vacancy' }).click() },
    { route: '/associations', open: () => page.getByRole('button', { name: 'Add association' }).click() },
    { route: '/board', open: () => page.getByRole('button', { name: 'Add term' }).click() },
    { route: '/board', open: () => page.getByRole('button', { name: 'Add member' }).first().click() },
    { route: '/daily-dish', open: () => page.getByRole('button', { name: 'Add dish' }).click() },
    { route: '/menu', open: () => page.getByRole('button', { name: 'Add tab' }).click() },
    {
      route: '/menu',
      open: async () => {
        await admin.openMenuSection('Drinks', 'Beers', 'House Pils')
        await page.getByRole('button', { name: 'Add item' }).first().click()
      },
    },
  ]

  for (const [i, form] of forms.entries()) {
    await page.goto(form.route)
    await form.open()
    await expect(page.locator('main form').first()).toBeVisible()
    const results = await new AxeBuilder({ page })
      .include('main form')
      .withRules(['label', 'select-name', 'aria-input-field-name', 'aria-allowed-role'])
      .analyze()
    const problems = results.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`))
    expect.soft(problems, `unnamed fields in form ${i + 1} on ${form.route}`).toEqual([])

    // axe accepts a placeholder as a name, which disappears once typing starts and is no label.
    // Every visible field must have a real <label> (or aria-labelledby), the thing that was missing.
    const unlabelled = await page.locator('main form').first().evaluate((el) =>
      [...el.querySelectorAll<HTMLInputElement>('input, select, textarea')]
        .filter((f) => f.type !== 'hidden' && f.offsetParent !== null && !f.closest('[aria-hidden="true"]'))
        .filter((f) => (f.labels?.length ?? 0) === 0 && !f.getAttribute('aria-labelledby') && !f.getAttribute('aria-label'))
        .map((f) => f.outerHTML.slice(0, 80)))
    expect.soft(unlabelled, `fields without a label in form ${i + 1} on ${form.route}`).toEqual([])
  }
})
