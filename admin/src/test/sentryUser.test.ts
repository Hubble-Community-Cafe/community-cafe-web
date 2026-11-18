import { describe, expect, it } from 'vitest'
import type { AccountInfo } from '@azure/msal-browser'
import { sentryUser } from '../lib/sentryUser'

describe('sentryUser', () => {
  it('identifies the staff member by object id only, never by email or name', () => {
    const account = {
      homeAccountId: 'home-id',
      environment: 'login.microsoftonline.com',
      tenantId: 'tenant',
      username: 'jan.jansen@hubble.cafe',
      localAccountId: '6f1c2b0a-oid',
      name: 'Jan Jansen',
    } as AccountInfo

    const user = sentryUser(account)

    expect(user).toEqual({ id: '6f1c2b0a-oid' })
    expect(JSON.stringify(user)).not.toContain('jan')
  })
})
