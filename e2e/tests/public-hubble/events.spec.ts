import { test, expect } from '@playwright/test'
import { resetBackend, seedEvent, inDays } from '../../fixtures/backend'

test.describe('Hubble events', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
    await seedEvent(request, {
      bar: 'HUBBLE', title: 'Pub Quiz Night', date: inDays(14), startTime: '20:00',
      price: 'Free', description: 'Test your trivia over a pint.', published: true,
    })
    await seedEvent(request, { bar: 'HUBBLE', title: 'Draft Event', date: inDays(7), published: false })
    await seedEvent(request, { bar: 'METEOR', title: 'Meteor Gig', date: inDays(10), published: true })
  })

  test('shows upcoming published Hubble events only', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByRole('heading', { name: 'Pub Quiz Night' })).toBeVisible()
    await expect(page.getByText('Test your trivia over a pint.')).toBeVisible()
    await expect(page.getByText('Draft Event')).toHaveCount(0)
    await expect(page.getByText('Meteor Gig')).toHaveCount(0)
  })
})
