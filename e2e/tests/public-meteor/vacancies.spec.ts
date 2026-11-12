import { test, expect } from '@playwright/test'
import { resetBackend, seedVacancy } from '../../fixtures/backend'
import { MeteorPublic } from '../../pages/MeteorPublic'

test.describe('Meteor vacancies', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedVacancy(request, {
      title: 'Kitchen Cook', bar: 'METEOR', hours: '26-38', type: 'Paid',
      description: 'Cook for the campus.\nNo weekends.',
    })
    await seedVacancy(request, { title: 'Hubble Only Role', bar: 'HUBBLE' })
    await seedVacancy(request, { title: 'Hidden Role', bar: 'METEOR', active: false })
  })

  test('shows active Meteor vacancies only, keeping line breaks', async ({ page }) => {
    const meteor = new MeteorPublic(page)
    await meteor.gotoVacancies()

    await expect(page.getByText('Kitchen Cook')).toBeVisible()
    await expect(page.getByText(/Cook for the campus\.\s+No weekends\./)).toHaveText('Cook for the campus.\nNo weekends.', { useInnerText: true })
    await expect(page.getByText('Hubble Only Role')).toHaveCount(0)
    await expect(page.getByText('Hidden Role')).toHaveCount(0)
  })
})
