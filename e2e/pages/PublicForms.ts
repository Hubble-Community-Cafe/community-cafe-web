import { type Locator, type Page } from '@playwright/test'

/**
 * Page objects for the public sites' forms. Fields are found by the label a visitor reads, not by
 * their id, so a spec breaks when a field loses its label (a real problem) rather than when an id
 * is renamed (a non-problem). Labels end in " *" for required fields, hence the anchored patterns.
 * Searches stay inside the page's form: the header has labelled links too ("…Cafe home").
 */
abstract class PublicForm {
  constructor(protected readonly page: Page) {}

  /** The form on the page. */
  get form(): Locator {
    return this.page.locator('main form')
  }

  protected field(label: RegExp): Locator {
    return this.form.getByLabel(label)
  }
}

/** Hubble tips, complaints and ideas (/contact/tips). */
export class HubbleTipsForm extends PublicForm {
  get name() { return this.field(/^Name/) }
  get email() { return this.field(/^Email/) }
  get type() { return this.field(/^Type of submission/) }
  get wantsUpdates() { return this.field(/receive updates on this subject/) }
  get message() { return this.field(/^Message/) }
}

/** Hubble information requests (/contact/information). */
export class HubbleInformationForm extends PublicForm {
  get name() { return this.field(/^Name/) }
  get email() { return this.field(/^Email/) }
  get phone() { return this.field(/^Phone/) }
  get message() { return this.field(/^Message/) }
}

/** Hubble equipment loans (/contact/loan-equipment). */
export class HubbleLoanForm extends PublicForm {
  get name() { return this.field(/^Name/) }
  get association() { return this.field(/^Association/) }
  get email() { return this.field(/^Email/) }
  get pickupDate() { return this.field(/^Pick-up date/) }
  get pickupTime() { return this.field(/^Pick-up time/) }
  get returnDate() { return this.field(/^Return date/) }
  get returnTime() { return this.field(/^Return time/) }
  get message() { return this.field(/^Message/) }
}

/** The expense declaration form, the same fields on both sites (/contact/declarations, /declarations). */
export class DeclarationForm extends PublicForm {
  get fullName() { return this.field(/^Full name/) }
  get email() { return this.field(/^Email address/) }
  get iban() { return this.field(/^IBAN/) }
  get dateOfPurchase() { return this.field(/^Date of purchase/) }
  get amount() { return this.field(/^Amount in euros/) }
  get category() { return this.field(/^Category/) }
  get receipt() { return this.field(/^Receipt/) }
  get description() { return this.field(/^Description/) }
}

/** Meteor tips and complaints (/complaints). */
export class MeteorComplaintsForm extends PublicForm {
  get name() { return this.field(/^Name/) }
  get email() { return this.field(/^Email/) }
  get type() { return this.field(/^Type/) }
  get message() { return this.field(/^Message/) }
}
