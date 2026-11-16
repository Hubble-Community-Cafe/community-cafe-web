import { test } from '@playwright/test'
import { expectSecurityHeadersEverywhere } from '../../fixtures/securityHeaders'

test('every Meteor response carries the security headers, without the nginx version', async ({ request }) => {
  await expectSecurityHeadersEverywhere(request)
})
