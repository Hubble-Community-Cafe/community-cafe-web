import type { AccountInfo } from '@azure/msal-browser'

/**
 * Who an admin error report belongs to, without personal data: only the Entra object id, which
 * staff can be looked up by in the admin users list. Never the email address or name, which Sentry
 * would otherwise store with every event.
 */
export function sentryUser(account: AccountInfo): { id: string } {
  return { id: account.localAccountId }
}
