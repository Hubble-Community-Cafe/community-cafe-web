import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { attachJson } from './evidence'
import {
  inDays, seedAssociation, seedBoardMember, seedBoardTerm, seedDailyDish, seedEvent, seedMenuCategory,
  seedMenuItem, seedVacancy, seedWeeklyHours, today,
} from './backend'
import { KNOWN_A11Y_ISSUES } from './a11y-known-issues'

/** WCAG 2.2 level A and AA, which includes every 2.0 and 2.1 A/AA rule. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export const HUBBLE_ROUTES = [
  '/', '/cafe', '/cafe/menu', '/cafe/discount-policy', '/cafe/daily-dish', '/events', '/community/committees',
  '/community/board', '/community/board/previous', '/community/board/supervisory', '/community/associations',
  '/vacancies', '/contact', '/contact/screens', '/contact/declarations', '/contact/tips', '/contact/information',
  '/contact/loan-equipment', '/privacy', '/plaza-page',
]
export const HUBBLE_FORMS = [
  '/contact/screens', '/contact/declarations', '/contact/tips', '/contact/information', '/contact/loan-equipment',
]

export const METEOR_ROUTES = [
  '/', '/menu', '/menu/discount-policy', '/agenda', '/community/board', '/community/board/previous', '/complaints',
  '/declarations', '/privacy',
]
export const METEOR_FORMS = ['/complaints', '/declarations']

export const ADMIN_ROUTES = [
  '/', '/menu', '/daily-dish', '/hours', '/events', '/board', '/vacancies', '/associations', '/media', '/screens',
  '/users', '/audit',
]

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

/** Content for every CMS module on both bars, so pages are scanned as visitors see them, not empty. */
export async function seedA11yContent(request: APIRequestContext): Promise<void> {
  for (const bar of ['HUBBLE', 'METEOR'] as const) {
    for (const day of WEEKDAYS) {
      await seedWeeklyHours(request, bar, day, { open: '12:00', close: '23:00' })
    }
    const tab = await seedMenuCategory(request, { name: 'Drinks', kind: 'DRINK', bar })
    const sub = await seedMenuCategory(request, { name: 'Beers', kind: 'DRINK', bar, parentId: tab.id })
    await seedMenuItem(request, sub.id, { name: 'House Pils', regularPrice: 3.0, studentPrice: 2.5 })
    await seedEvent(request, { bar, title: `${bar} pub quiz`, date: inDays(7), startTime: '20:00' })
  }
  await seedDailyDish(request, { date: today(), name: 'Vegetable curry', description: 'With rice', price: 5.5 })
  const term = await seedBoardTerm(request, { label: 'Board 2026', type: 'EXECUTIVE', bar: null, current: true })
  await seedBoardMember(request, term.id, { name: 'Robin Bestuur', role: 'President' })
  const previous = await seedBoardTerm(request, { label: 'Board 2025', type: 'EXECUTIVE', bar: 'HUBBLE' })
  await seedBoardMember(request, previous.id, { name: 'Sam Oud', role: 'Treasurer' })
  const supervisory = await seedBoardTerm(request, { label: 'Supervisory board', type: 'SUPERVISORY', bar: null, current: true })
  await seedBoardMember(request, supervisory.id, { name: 'Kim Toezicht', role: 'Chair' })
  await seedVacancy(request, { title: 'Bartender', bar: 'HUBBLE', description: 'Join the team', hours: '4 hours a week' })
  await seedAssociation(request, { name: 'Inter Actief', bar: 'HUBBLE' })
}

/**
 * Runs axe (WCAG 2.2 A/AA) on the current, settled page state. Violations listed for this page in
 * a11y-known-issues.ts are reported in the attachment but tolerated; any other violation fails the
 * test. Soft, so one test scanning several pages reports every page in a single run.
 */
export async function expectNoNewA11yViolations(page: Page, testInfo: TestInfo, label: string): Promise<void> {
  // Scan the settled page: text measured mid-animation reports a lower contrast than users see.
  // Endless animations (a carousel, a ticker) never settle, so only finite ones are waited for.
  await page.waitForFunction(() => document.getAnimations().every(
    (a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity))
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  await attachJson(testInfo, `axe-${label.replace(/[^a-z0-9]+/gi, '-')}.json`, results.violations)

  const known = KNOWN_A11Y_ISSUES[`${testInfo.project.name} ${label}`] ?? []
  const summary = results.violations
    .filter((v) => !known.includes(v.id))
    .map((v) => {
      const targets = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')
      return `${v.id} [${v.impact}] ${v.help}: ${v.nodes.length} element(s), e.g. ${targets}`
    })
  expect.soft(summary, `new accessibility violations on "${label}"`).toEqual([])
}

/** Visits each route and scans it once the page has rendered its main content. */
export async function scanRoutes(page: Page, testInfo: TestInfo, routes: string[]): Promise<void> {
  for (const route of routes) {
    await page.goto(route)
    // Most pages render a <main>; the plaza kiosk screen has no site layout and therefore none.
    await page.locator('main').first().waitFor({ timeout: 5_000 }).catch(() => undefined)
    // Let data requests and images load. Some pages poll (the home page status, the plaza kiosk)
    // and never go idle, so this wait is bounded.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
    await expectNoNewA11yViolations(page, testInfo, route)
  }
}

/** Submits each form empty, so the validation messages are scanned too. */
export async function scanFormErrors(page: Page, testInfo: TestInfo, forms: string[]): Promise<void> {
  for (const route of forms) {
    await page.goto(route)
    await page.locator('form').first().locator('button[type="submit"]').first().click()
    await page.waitForTimeout(300)
    await expectNoNewA11yViolations(page, testInfo, `${route} errors`)
  }
}
