import { type Page, type Locator } from '@playwright/test'

/** Page object for the Users page at /users, where admins set each person's access per tab. */
export class UsersAdminPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/users')
  }

  /** The list entry of one person, by name or email. */
  row(nameOrEmail: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: nameOrEmail })
  }

  changeAccessButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Change access for ${name}` })
  }

  /** The open access form of one person. */
  form(name: string): Locator {
    return this.page.getByRole('form', { name: `Access for ${name}` })
  }

  /** One tab's level radio in that form (e.g. tab "Events", level "Edit"). */
  level(name: string, tab: string, level: 'Hidden' | 'View' | 'Edit'): Locator {
    return this.form(name).getByRole('radiogroup', { name: tab }).getByText(level, { exact: true })
  }

  async save(name: string): Promise<void> {
    await this.form(name).getByRole('button', { name: /Save access/ }).click()
  }
}
