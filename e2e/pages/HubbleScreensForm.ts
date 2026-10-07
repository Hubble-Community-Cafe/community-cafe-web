import { type Page, type Locator, expect } from '@playwright/test'

/** Minimal 1x1 PNG, enough for the content-type and size checks. */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/QGyAAAAAElFTkSuQmCC',
  'base64',
)

export interface ScreensRequest {
  name: string
  association: string
  email: string
  /** Start and end date (YYYY-MM-DD), or leave out for a permanent poster. */
  dates?: { start: string; end: string }
  hexColor?: string
  message?: string
  file?: { name: string; mimeType: string; buffer: Buffer }
}

/**
 * Page object for the Hubble poster screens form at /contact/screens. Selectors live here so
 * specs read as behaviour.
 */
export class HubbleScreensForm {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/contact/screens')
    await expect(this.page.getByRole('heading', { name: 'Hubble Poster Screens' })).toBeVisible()
  }

  async fill(req: ScreensRequest): Promise<void> {
    await this.page.locator('#s-name').fill(req.name)
    await this.page.locator('#s-assoc').fill(req.association)
    await this.page.locator('#s-email').fill(req.email)
    if (req.dates) {
      await this.page.locator('#s-start').fill(req.dates.start)
      await this.page.locator('#s-end').fill(req.dates.end)
    } else {
      // Dates are disabled for a permanent poster; submit without them.
      await this.page.getByRole('checkbox', { name: /permanent poster/i }).check()
    }
    if (req.hexColor) await this.page.locator('#s-hex').fill(req.hexColor)
    if (req.message) await this.page.locator('#s-msg').fill(req.message)
    await this.page.locator('#s-file').setInputFiles(
      req.file ?? { name: 'poster.png', mimeType: 'image/png', buffer: PNG },
    )
  }

  /** The square next to the colour field that previews the colour and opens the picker. */
  colourSwatch(): Locator {
    return this.page.getByRole('button', { name: 'Pick a colour' })
  }

  colourPicker(): Locator {
    return this.page.getByRole('dialog', { name: 'Colour picker' })
  }

  /**
   * Opens the picker and clicks a spot in its colour area, as fractions of its width (white to
   * full colour) and height (bright to dark). Returns the hex the field then holds.
   */
  async pickColour(x: number, y: number): Promise<string> {
    const hex = this.page.locator('#s-hex')
    const before = await hex.inputValue()
    await this.colourSwatch().click()
    const area = this.colourPicker().getByRole('slider', { name: 'Color' })
    const box = (await area.boundingBox())!
    await area.click({ position: { x: box.width * x, y: box.height * y } })
    // The picker reports the new colour just after it redraws, so wait for the field to follow.
    await expect(hex).not.toHaveValue(before)
    return hex.inputValue()
  }

  async send(): Promise<void> {
    await this.page.getByRole('button', { name: 'Send request' }).click()
  }

  /** The heading shown once the request went through. */
  sentHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Request received' })
  }

  /** The upload progress bar shown while sending. */
  progressBar(): Locator {
    return this.page.getByRole('progressbar')
  }

  /**
   * Our own form error. Matched by text, because the ALTCHA widget also renders a role="alert"
   * popover.
   */
  error(text: RegExp): Locator {
    return this.page.getByText(text)
  }
}
