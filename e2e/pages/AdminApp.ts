import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Page object for the admin app. Under the e2e stack the admin authenticates as a fixed
 * identity (E2E_AUTH_OID); the spec sets that user's role via the backend before navigating.
 */
export class AdminApp {
  constructor(private readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
  }

  /** The left-nav link for a module (e.g. "Associations", "Daily dish"). */
  navLink(label: string): Locator {
    return this.page.getByRole('navigation', { name: 'Admin' }).getByText(label, { exact: true })
  }

  /** A primary "Add X" button (vacancies, associations, board, events, menu tabs, dishes). */
  addButton(name: RegExp | string): Locator {
    return this.page.getByRole('button', { name })
  }

  /** Per-row edit affordance (pencil), used to assert read-only viewers cannot edit. */
  editButtons(): Locator {
    return this.page.getByRole('button', { name: /edit/i })
  }

  async expectDashboardRole(role: string): Promise<void> {
    await this.page.goto('/')
    await expect(this.page.getByText(role, { exact: true })).toBeVisible()
  }
}
