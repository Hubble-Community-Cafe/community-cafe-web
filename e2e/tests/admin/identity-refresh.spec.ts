import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test'
import { resetBackend, seedUser } from '../../fixtures/backend'
import { BACKEND_URL } from '../../playwright.config'

/**
 * Fire the same request from N independent contexts. A single APIRequestContext pools its
 * connections and would serialise these, which is not enough to provoke the race.
 */
async function inParallel(
  count: number,
  headers: Record<string, string>,
  path: string,
): Promise<number[]> {
  const contexts: APIRequestContext[] = await Promise.all(
    Array.from({ length: count }, () => playwrightRequest.newContext()),
  )
  try {
    const responses = await Promise.all(
      contexts.map((c) => c.get(`${BACKEND_URL}${path}`, { headers })),
    )
    return responses.map((r) => r.status())
  } finally {
    await Promise.all(contexts.map((c) => c.dispose()))
  }
}

/**
 * Regression: the auth filter mirrors the token's email and display name onto the stored row on
 * every admin request. When those drift (someone's name changes in Entra), a burst of concurrent
 * requests all race to write the same new values.
 *
 * MariaDB 11.6+ ships innodb_snapshot_isolation on by default, which raises error 1020 ("Record
 * has changed since last read") instead of serialising that race, so every loser used to come back
 * as a 500. This has to run against the real MariaDB in the e2e stack; H2 will not reproduce it.
 */
test.describe('Admin identity refresh under concurrency', () => {
  const OID = 'identity-race-user'
  const CONCURRENT = 16

  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('concurrent requests with drifted claims all succeed', async ({ request }) => {
    // The race window is between the read and the write, so one burst catches the old bug only
    // sometimes. Re-drift the stored name and burst again a few times to make it dependable.
    const ROUNDS = 5
    let headers: Record<string, string> = {}

    for (let round = 0; round < ROUNDS; round++) {
      // Reset the row to a value the incoming claims will not match.
      await seedUser(request, { oid: OID, email: 'old@e2e.test', name: 'Old Name', role: 'ADMIN' })

      headers = {
        'X-Test-Oid': OID,
        'X-Test-Email': `new${round}@e2e.test`,
        'X-Test-Name': `New Name ${round}`,
      }
      const statuses = await inParallel(CONCURRENT, headers, '/api/admin/users/me')

      expect(statuses, `round ${round} returned a non-200`).toEqual(Array(CONCURRENT).fill(200))
    }

    // The row converged on the last round's values, and the race left it intact.
    const after = await request.get(`${BACKEND_URL}/api/admin/users/me`, { headers })
    expect(await after.json()).toMatchObject({
      email: `new${ROUNDS - 1}@e2e.test`,
      displayName: `New Name ${ROUNDS - 1}`,
      role: 'ADMIN',
    })
  })

  test('a request whose claims already match stays a plain read', async ({ request }) => {
    await seedUser(request, { oid: OID, email: 'same@e2e.test', name: 'Same Name', role: 'EDITOR' })

    const headers = { 'X-Test-Oid': OID, 'X-Test-Email': 'same@e2e.test', 'X-Test-Name': 'Same Name' }
    const statuses = await inParallel(CONCURRENT, headers, '/api/admin/users/me')

    expect(statuses).toEqual(Array(CONCURRENT).fill(200))
  })
})
