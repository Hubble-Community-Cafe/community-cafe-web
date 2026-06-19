import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Page object for the public Hubble site. Selectors live here so specs read as
 * behaviour; update this file (and the components) when markup changes.
 */
export class HubblePublic {
  constructor(private readonly page: Page) {}

  async gotoHome(): Promise<void> {
    await this.page.goto('/')
    await expect(this.page.getByRole('heading', { name: 'Opening Times' })).toBeVisible()
  }

  async gotoAssociations(): Promise<void> {
    await this.page.goto('/community/associations')
    await expect(this.page.getByRole('heading', { name: 'Associations' })).toBeVisible()
  }

  async gotoVacancies(): Promise<void> {
    await this.page.goto('/vacancies')
  }

  async gotoMenu(): Promise<void> {
    await this.page.goto('/cafe/menu')
  }

  footer(): Locator {
    return this.page.locator('footer')
  }

  /** A row in the home "Opening Times" card, by its day-range label. */
  openingTimesRow(label: string): Locator {
    return this.page.getByRole('term').filter({ hasText: label })
  }
}
