import { test, expect } from '@playwright/test'
import { resetBackend, seedBoardTerm, seedBoardMember } from '../../fixtures/backend'

test.describe('Hubble board pages', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)

    const current = await seedBoardTerm(request, { label: 'Board 2026', type: 'EXECUTIVE', bar: null, current: true })
    await seedBoardMember(request, current.id, { name: 'Alex Chair', role: 'President' })

    const previous = await seedBoardTerm(request, { label: 'Board 2024', type: 'EXECUTIVE', bar: 'HUBBLE', current: false })
    await seedBoardMember(request, previous.id, { name: 'Sam Former' })

    const supervisory = await seedBoardTerm(request, { label: 'RvT 2026', type: 'SUPERVISORY', bar: 'HUBBLE', current: true })
    await seedBoardMember(request, supervisory.id, { name: 'Dana Oversight', role: 'Chair' })
  })

  test('current board lists the shared executive members', async ({ page }) => {
    await page.goto('/community/board')
    await expect(page.getByText('Alex Chair')).toBeVisible()
    await expect(page.getByText('President')).toBeVisible()
  })

  test('previous boards lists former terms by name', async ({ page }) => {
    await page.goto('/community/board/previous')
    await expect(page.getByRole('heading', { name: 'Board 2024' })).toBeVisible()
    await expect(page.getByText('Sam Former')).toBeVisible()
  })

  test('supervisory board lists members with their role', async ({ page }) => {
    await page.goto('/community/board/supervisory')
    await expect(page.getByText('Dana Oversight (Chair)')).toBeVisible()
  })
})
