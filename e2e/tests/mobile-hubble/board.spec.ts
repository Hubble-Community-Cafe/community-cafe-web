import { test, expect } from '@playwright/test'
import { resetBackend, seedBoardTerm, seedBoardMember } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble board on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    // The current executive board is shared across both bars (bar = null).
    const term = await seedBoardTerm(request, { label: 'Board 2026', type: 'EXECUTIVE', bar: null, current: true })
    await seedBoardMember(request, term.id, { name: 'Robin Bestuur', role: 'President' })
  })

  test('renders the current board members on a phone', async ({ page }, testInfo) => {
    await page.goto('/community/board')

    await expect(page.getByText('Robin Bestuur')).toBeVisible()
    await expect(page.getByText('President')).toBeVisible()
    await captureScreenshot(testInfo, page, 'mobile-hubble-board')
  })
})
