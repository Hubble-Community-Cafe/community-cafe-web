import { test, expect } from '@playwright/test'
import { resetBackend, seedVacancy } from '../../fixtures/backend'
import { HubblePublic } from '../../pages/HubblePublic'

test.describe('Hubble vacancies', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedVacancy(request, {
      title: 'Bar Manager', bar: 'HUBBLE', hours: '10-15 hrs/week', type: 'Paid',
      description: 'Lead the bar team and keep the taps flowing.',
    })
    await seedVacancy(request, { title: 'Hidden Role', bar: 'HUBBLE', active: false })
  })

  test('shows active vacancies with their details and hides inactive ones', async ({ page }) => {
    const hubble = new HubblePublic(page)
    await hubble.gotoVacancies()

    await expect(page.getByText('Bar Manager')).toBeVisible()
    await expect(page.getByText('Lead the bar team and keep the taps flowing.')).toBeVisible()
    await expect(page.getByText('Hidden Role')).toHaveCount(0)
  })
})
