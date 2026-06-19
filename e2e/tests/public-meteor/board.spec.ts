import { test, expect } from '@playwright/test'
import { resetBackend, seedBoardTerm, seedBoardMember } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'

test.describe('Meteor board', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    // The current executive board is shared across both bars (bar = null).
    const term = await seedBoardTerm(request, { label: 'Board 2026', type: 'EXECUTIVE', bar: null, current: true })
    await seedBoardMember(request, term.id, { name: 'Robin Bestuur', role: 'President' })
  })

  test('shows the current shared board members', async ({ page }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoBoard()

    await expect(page.getByText('Robin Bestuur')).toBeVisible()
  })
})
