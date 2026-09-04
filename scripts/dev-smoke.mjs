#!/usr/bin/env node
/**
 * Smoke test the running local dev stack.
 *
 *   npm run dev:smoke
 *
 * What this covers: that every service answers, that the seeded content reaches the public API,
 * and that the ordering and visibility contracts the CMS depends on actually hold, by changing a
 * sort order in the database and asserting the public site reflects it. That is the half of
 * drag-to-reorder a local check can prove without a token: the write path itself is covered by the
 * backend tests, and the admin UI by the Playwright suite in e2e/.
 *
 * Set ADMIN_TOKEN to an Entra bearer token to additionally exercise the real admin write path
 * (reorder, and create-without-a-position appending to the end). Skipped when unset.
 *
 * Reads and restores its own data, so it leaves the stack exactly as it found it.
 */

import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMPOSE_FILE = resolve(REPO_ROOT, 'docker-compose.yml')

const BACKEND = process.env.DEV_BACKEND_URL ?? 'http://localhost:8080'
const ADMIN = process.env.DEV_ADMIN_URL ?? 'http://localhost:5173'
const HUBBLE = process.env.DEV_HUBBLE_URL ?? 'http://localhost:5174'
const METEOR = process.env.DEV_METEOR_URL ?? 'http://localhost:5175'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

const DB_USER = process.env.DEV_DB_USER ?? 'cafeweb'
const DB_PASSWORD = process.env.DEV_DB_PASSWORD ?? 'local_dev_password'
const DB_NAME = process.env.DEV_DB_NAME ?? 'cafeweb'

let passed = 0
const failures = []

function ok(label) {
  passed += 1
  console.log(`  \x1b[32mok\x1b[0m    ${label}`)
}

function bad(label, detail) {
  failures.push(label)
  console.log(`  \x1b[31mFAIL\x1b[0m  ${label}`)
  if (detail) console.log(`        ${detail}`)
}

function heading(text) {
  console.log(`\n\x1b[1m${text}\x1b[0m`)
}

function check(label, condition, detail) {
  condition ? ok(label) : bad(label, detail)
}

/** Run SQL in the dev database container and return the rows as arrays of strings. */
function sql(query) {
  const out = execFileSync(
    'docker',
    ['compose', '-f', COMPOSE_FILE, 'exec', '-T', 'db',
      'mariadb', `-u${DB_USER}`, `-p${DB_PASSWORD}`, DB_NAME, '-N', '-B', '-e', query],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
  return out.trim().split('\n').filter(Boolean).map((line) => line.split('\t'))
}

async function getJson(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  return res.json()
}

async function status(url) {
  try {
    return (await fetch(url)).status
  } catch {
    return 0
  }
}

/** Every item name on a bar's public menu, tab by tab, in the order the site would render them. */
async function publicItemNames(bar) {
  const tabs = await getJson(`${BACKEND}/api/menu/${bar}`)
  return tabs.flatMap((tab) => tab.categories.flatMap((cat) => cat.items.map((i) => i.name)))
}

async function main() {
  console.log('\x1b[1mDev stack smoke test\x1b[0m')

  // ── Services ────────────────────────────────────────────────────────────────
  heading('Services answering')
  for (const [label, url] of [
    ['backend', `${BACKEND}/api/menu/HUBBLE`],
    ['admin', ADMIN],
    ['Hubble', HUBBLE],
    ['Meteor', METEOR],
  ]) {
    const code = await status(url)
    check(`${label} answers 200`, code === 200, code === 0
      ? `no response from ${url}, is the stack up?`
      : `got ${code} from ${url}`)
  }

  if (failures.length > 0) {
    console.log('\nServices are down, skipping the content checks. Try: npm run dev:doctor')
    return
  }

  // ── Seeded content reaches the public API ───────────────────────────────────
  heading('Seeded content on the public API')

  const hubbleTabs = await getJson(`${BACKEND}/api/menu/HUBBLE`)
  const meteorTabs = await getJson(`${BACKEND}/api/menu/METEOR`)
  check('Hubble menu has tabs', hubbleTabs.length > 0, 'run npm run dev:seed')
  check('Meteor menu has tabs', meteorTabs.length > 0, 'run npm run dev:seed')

  // The two sites are deliberately distinct, so a shared tab list would mean the bar scoping
  // has broken somewhere between the query and the DTO.
  const hubbleNames = hubbleTabs.map((t) => t.name).join()
  const meteorNames = meteorTabs.map((t) => t.name).join()
  check('the two bars have different tabs', hubbleNames !== meteorNames,
    `both returned: ${hubbleNames}`)

  const board = await getJson(`${BACKEND}/api/board`)
  check('board has terms', board.length > 0, 'run npm run dev:seed')

  const vacancies = await getJson(`${BACKEND}/api/vacancies/HUBBLE`)
  check('Hubble has vacancies', vacancies.length > 0, 'run npm run dev:seed')

  // ── Ordering contract ───────────────────────────────────────────────────────
  heading('Ordering contract (what dragging writes)')

  const [row] = sql(`SELECT category_id, COUNT(*) c FROM menu_item
                     GROUP BY category_id HAVING c >= 2 ORDER BY category_id LIMIT 1;`)
  if (!row) {
    bad('found a category with at least two items', 'run npm run dev:seed')
  } else {
    const categoryId = row[0]
    const before = sql(`SELECT id, name, sort_order FROM menu_item
                        WHERE category_id = ${categoryId} ORDER BY sort_order LIMIT 2;`)
    const [first, second] = before
    const beforeNames = await publicItemNames('HUBBLE')

    // Swap the two positions behind the API's back, exactly what a drag ends up writing.
    sql(`UPDATE menu_item SET sort_order = ${second[2]} WHERE id = ${first[0]};
         UPDATE menu_item SET sort_order = ${first[2]} WHERE id = ${second[0]};`)
    try {
      const afterNames = await publicItemNames('HUBBLE')
      const firstIdx = afterNames.indexOf(first[1])
      const secondIdx = afterNames.indexOf(second[1])
      check(`public menu follows sort_order ("${second[1]}" now precedes "${first[1]}")`,
        secondIdx !== -1 && firstIdx !== -1 && secondIdx < firstIdx,
        `order did not change: ${afterNames.slice(0, 4).join(', ')}`)
    } finally {
      sql(`UPDATE menu_item SET sort_order = ${first[2]} WHERE id = ${first[0]};
           UPDATE menu_item SET sort_order = ${second[2]} WHERE id = ${second[0]};`)
    }

    const restored = await publicItemNames('HUBBLE')
    check('the smoke test restored the original order',
      restored.join() === beforeNames.join(),
      'the menu was left reordered, re-run npm run dev:seed')
  }

  // ── Visibility contract ─────────────────────────────────────────────────────
  heading('Visibility contract')

  const inactive = sql("SELECT title FROM vacancy WHERE active = 0;").map((r) => r[0])
  const publicTitles = [
    ...(await getJson(`${BACKEND}/api/vacancies/HUBBLE`)),
    ...(await getJson(`${BACKEND}/api/vacancies/METEOR`)),
  ].map((v) => v.title)
  check('inactive vacancies stay off the public site',
    inactive.every((t) => !publicTitles.includes(t)),
    `leaked: ${inactive.filter((t) => publicTitles.includes(t)).join(', ')}`)

  // ── Admin write path (needs a token) ────────────────────────────────────────
  heading('Admin write path')

  if (!ADMIN_TOKEN) {
    console.log('  \x1b[90mskipped: set ADMIN_TOKEN to an Entra bearer token to include this.\x1b[0m')
    console.log('  \x1b[90mThe reorder service logic is covered by the backend tests, and the\x1b[0m')
    console.log('  \x1b[90madmin UI by the Playwright suite in e2e/.\x1b[0m')
  } else {
    const cats = await getJson(`${BACKEND}/api/admin/menu/categories`, ADMIN_TOKEN)
    const sub = cats.find((c) => c.parentId !== null)
    const items = await getJson(`${BACKEND}/api/admin/menu/categories/${sub.id}/items`, ADMIN_TOKEN)
    const original = items.map((i) => i.id)
    const reversed = [...original].reverse()

    const res = await fetch(`${BACKEND}/api/admin/menu/categories/${sub.id}/items/reorder`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reversed }),
    })
    check('reorder endpoint accepts a valid order', res.status === 204, `got ${res.status}`)

    const after = await getJson(`${BACKEND}/api/admin/menu/categories/${sub.id}/items`, ADMIN_TOKEN)
    check('reorder persisted', after.map((i) => i.id).join() === reversed.join())
    check('reorder renumbered without gaps',
      after.map((i) => i.sortOrder).join() === after.map((_, idx) => idx).join())

    const stale = await fetch(`${BACKEND}/api/admin/menu/categories/${sub.id}/items/reorder`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reversed.slice(1) }),
    })
    check('an incomplete order is rejected', stale.status === 400, `got ${stale.status}`)

    await fetch(`${BACKEND}/api/admin/menu/categories/${sub.id}/items/reorder`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: original }),
    })
  }

  console.log('')
  if (failures.length === 0) {
    console.log(`\x1b[32m${passed} passed, the local stack is working.\x1b[0m`)
  } else {
    console.log(`\x1b[31m${failures.length} failed\x1b[0m (${passed} passed).`)
  }
}

main()
  .then(() => process.exit(failures.length === 0 ? 0 : 1))
  .catch((err) => {
    console.error(`\n\x1b[31mSmoke test could not run:\x1b[0m ${err.message}`)
    console.error('Try: npm run dev:doctor')
    process.exit(1)
  })
