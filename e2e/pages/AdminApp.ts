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

  // ── Reordering ──────────────────────────────────────────────────────────────

  /** The drag handle of a row, by the name it was given ("Reorder Mojito"). */
  dragHandle(name: string): Locator {
    return this.page.getByRole('button', { name: `Reorder ${name}` })
  }

  /**
   * Drag one row onto another with the mouse.
   *
   * Deliberately not `dragTo`: dnd-kit only starts tracking after the pointer has travelled past
   * its activation distance, so the gesture needs a small nudge and then stepped movement rather
   * than one jump from source to target.
   */
  async dragRowOnto(name: string, ontoName: string): Promise<void> {
    const from = await this.dragHandle(name).boundingBox()
    const to = await this.dragHandle(ontoName).boundingBox()
    if (!from || !to) throw new Error(`Cannot drag "${name}" onto "${ontoName}": a handle is not visible`)

    const startX = from.x + from.width / 2
    const startY = from.y + from.height / 2
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX, startY + 8, { steps: 4 })
    await this.page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
    await this.page.mouse.up()
  }

  /**
   * Drag one row onto another with a finger.
   *
   * Playwright's mouse API does not become touch under device emulation, and its touchscreen can
   * only tap, so a real touch drag has to be dispatched over CDP. Worth the detour: touch is the
   * path that native HTML5 drag and drop cannot do at all, and the reason the handles are built on
   * pointer events.
   */
  async touchDragRowOnto(name: string, ontoName: string): Promise<void> {
    const from = await this.dragHandle(name).boundingBox()
    const to = await this.dragHandle(ontoName).boundingBox()
    if (!from || !to) throw new Error(`Cannot drag "${name}" onto "${ontoName}": a handle is not visible`)

    const x = from.x + from.width / 2
    const startY = from.y + from.height / 2
    const endY = to.y + to.height / 2

    const cdp = await this.page.context().newCDPSession(this.page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: y === undefined ? [] : [{ x, y }],
      })

    await touch('touchStart', startY)
    // Past the activation distance first, then in steps, the same as the mouse path.
    await touch('touchMove', startY + 8)
    const steps = 10
    for (let i = 1; i <= steps; i += 1) {
      await touch('touchMove', startY + ((endY - startY) * i) / steps)
      await this.page.waitForTimeout(16)
    }
    await touch('touchEnd')
    await cdp.detach()
  }

  /**
   * Reorder without a pointer: focus the handle, space to pick up, arrows, space to drop.
   *
   * The pauses are not padding. Picking up and each subsequent move settle over an animation frame,
   * and arrow presses sent within the same tick are dropped, which reads as the keyboard path
   * silently not working.
   */
  async reorderWithKeyboard(name: string, key: 'ArrowUp' | 'ArrowDown', times = 1): Promise<void> {
    await this.dragHandle(name).focus()
    await this.page.keyboard.press('Space')
    await this.page.waitForTimeout(200)
    for (let i = 0; i < times; i += 1) {
      await this.page.keyboard.press(key)
      await this.page.waitForTimeout(150)
    }
    await this.page.keyboard.press('Space')
  }

  // ── Menu items ──────────────────────────────────────────────────────────────

  /**
   * The item rows currently listed, in display order. Read from the per-row checkboxes, which only
   * items have; the "Select all items in X" box is excluded so it cannot be mistaken for a row.
   */
  async itemOrder(): Promise<string[]> {
    return this.page.locator('input[type="checkbox"][aria-label^="Select "]').evaluateAll((boxes) =>
      boxes
        .map((box) => box.getAttribute('aria-label') ?? '')
        .filter((label) => !label.startsWith('Select all '))
        .map((label) => label.replace(/^Select /, '')),
    )
  }

  itemCheckbox(name: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select ${name}`, exact: true })
  }

  selectAllItems(categoryName: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select all items in ${categoryName}` })
  }

  /** The bulk bar's summary, e.g. "3 items selected". Absent when nothing is selected. */
  selectionCount(): Locator {
    return this.page.getByText(/^\d+ items? selected$/)
  }
}
