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

  /**
   * A field by the label a visitor reads (see PublicForms.ts for why not by id), searched inside
   * the form only. Labels end in " *" for required fields, hence the anchored patterns below.
   */
  field(label: RegExp): Locator {
    return this.page.locator('main form').getByLabel(label)
  }

  /** The clock/progress colour, a hex like #FFF200. */
  colourField(): Locator {
    return this.field(/^Clock \/ progress colour/)
  }

  async goto(): Promise<void> {
    await this.page.goto('/contact/screens')
    await expect(this.page.getByRole('heading', { name: 'Hubble Poster Screens' })).toBeVisible()
  }

  async fill(req: ScreensRequest): Promise<void> {
    await this.field(/^Name/).fill(req.name)
    await this.field(/^Association/).fill(req.association)
    await this.field(/^Email/).fill(req.email)
    if (req.dates) {
      await this.field(/^Start date/).fill(req.dates.start)
      await this.field(/^End date/).fill(req.dates.end)
    } else {
      // Dates are disabled for a permanent poster; submit without them.
      await this.page.getByRole('checkbox', { name: /permanent poster/i }).check()
    }
    if (req.hexColor) await this.colourField().fill(req.hexColor)
    if (req.message) await this.field(/^Message/).fill(req.message)
    await this.field(/^Poster file/).setInputFiles(
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
    const hex = this.colourField()
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
