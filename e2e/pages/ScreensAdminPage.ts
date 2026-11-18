import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Page object for the Aurora screen scene panel at /screens.
 *
 * <p>Under the e2e stack the backend swaps in an in-memory Aurora (FakeAuroraClient, e2e profile
 * only), so the panel is fully operable without a real narrowcasting instance.
 */
export class ScreensAdminPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/screens')
  }

  /** One of the three scene buttons. */
  sceneButton(label: 'Open' | 'Last call' | 'Closed'): Locator {
    return this.page.getByRole('button', { name: new RegExp(label) })
  }

  /** The badge showing what the screens are doing right now. */
  currentScene(): Locator {
    return this.page.locator('section').filter({ hasText: 'Current scene' })
      .locator('span').first()
  }

  /** A screen row, by the name Aurora reports. */
  screenRow(name: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: name })
  }

  posterSelect(scene: 'Closed' | 'Last call'): Locator {
    return this.page.getByLabel(scene, { exact: true })
  }

  /**
   * Choose a scene's poster and wait until it is saved. The page saves in the background, so a
   * scene clicked straight after could otherwise still run with the previous poster.
   */
  async choosePoster(scene: 'Closed' | 'Last call', label: string): Promise<void> {
    const saved = this.page.waitForResponse((r) =>
      r.url().endsWith('/api/admin/screens/settings') && r.request().method() === 'PUT')
    await this.posterSelect(scene).selectOption({ label })
    await saved
  }

  async apply(label: 'Open' | 'Last call' | 'Closed'): Promise<void> {
    await this.sceneButton(label).click()
    await expect(this.currentScene()).toHaveText(label)
  }

  async expectHandler(screenName: string, handler: string): Promise<void> {
    await expect(this.screenRow(screenName)).toContainText(handler)
  }
}
