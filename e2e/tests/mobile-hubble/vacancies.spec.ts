import { test, expect } from '@playwright/test'
import { resetBackend, seedVacancy } from '../../fixtures/backend'
import { captureScreenshot } from '../../fixtures/evidence'

test.describe('Hubble vacancies on mobile', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedVacancy(request, {
      title: 'Bar Manager', bar: 'HUBBLE', hours: '10-15 hrs/week', type: 'Paid',
      description: 'Lead the bar team and keep the taps flowing.',
    })
    await seedVacancy(request, { title: 'Hidden Role', bar: 'HUBBLE', active: false })
  })

  test('lists active vacancies and hides inactive ones on a phone', async ({ page }, testInfo) => {
    await page.goto('/vacancies')
    await expect(page.getByText('Bar Manager')).toBeVisible()
    await expect(page.getByText('Hidden Role')).toHaveCount(0)
    await captureScreenshot(testInfo, page, 'mobile-hubble-vacancies')
  })
})
