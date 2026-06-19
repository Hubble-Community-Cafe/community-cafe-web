import { type Page, expect } from '@playwright/test'

/** Page object for the public Meteor site. */
export class MeteorPublic {
  constructor(private readonly page: Page) {}

  async gotoHome(): Promise<void> {
    await this.page.goto('/')
    await expect(this.page.locator('footer')).toBeVisible()
  }

  async gotoMenu(): Promise<void> {
    await this.page.goto('/menu')
  }

  async gotoBoard(): Promise<void> {
    await this.page.goto('/community/board')
  }
}
