# e2e, Playwright full-stack tests

Browser tests across both public sites + the admin, **desktop and mobile**, against a real backend + MariaDB. Mirrors the Harry List e2e harness: e2e-only `/test` reset + user seeding, content seeded through the real admin API via the `X-Test-Oid` header bridge, and evidence capture (screenshots/JSON attached to the HTML report).

## Running

```bash
npm install                 # once
npx playwright install chromium  # once: the browser Playwright drives
npm run stack:up            # build + start the e2e docker stack (or let `npm test` boot it)
npm test                    # run all projects (boots the stack if not already up)
npm run stack:down          # tear down + wipe the e2e database
```

The stack is `docker-compose.e2e.yml`: MariaDB + backend (`e2e` Spring profile, header-auth bridge) + both public sites + the admin, on ports 6173 (Hubble), 6174 (admin), 6175 (Meteor), 8090 (backend, deliberately not the dev stack's 8080). Set `E2E_NO_WEBSERVER=1` to run specs against an already-running stack.

Projects (see `playwright.config.ts`): `public-hubble`, `public-meteor`, `admin` (Desktop Chrome), and `mobile-hubble`, `mobile-meteor` (Pixel 5). Page objects live in `pages/`, fixtures in `fixtures/` (`backend.ts` = reset/seed helpers, `mailpit.ts` = form-email assertions via the Mailpit API on :8025, `evidence.ts` = report attachments).

`identity-refresh.spec.ts` is a concurrency regression and needs real MariaDB, so it lives here rather than in the backend suite: MariaDB 11.6+ enables `innodb_snapshot_isolation` by default, which H2 cannot imitate. It fires each burst from independent `APIRequestContext`s, since a single context pools connections and would serialise them.

The screen scene panel talks to Aurora, which does not exist in the e2e stack. Under the `e2e` profile the backend swaps in `FakeAuroraClient`, an in-memory stand-in with three screens named after the live ones. `/test/reset` puts every screen back on the carousel and re-seeds the poster mapping, so specs cannot leak scene state into each other. The real HTTP contract with Aurora is covered separately by `AuroraClientTest` against `MockRestServiceServer`.

## Troubleshooting

- **`/test/reset` rejected (403/401):** the backend answering on 8090 is not running the current `e2e` security chain. Almost always a **stale backend image** (a plain `up --build` can reuse a cached Maven layer, and `npm test` reuses an already-running stack). Force fresh bytecode:
  ```bash
  npm run stack:down
  docker compose -f ../docker-compose.e2e.yml down --rmi local -v --remove-orphans
  docker compose -f ../docker-compose.e2e.yml build --no-cache backend
  npm run stack:up
  curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:8090/test/reset   # want 204
  ```
- **Use `127.0.0.1`, not `localhost`,** when curling the stack: `localhost` resolves to both IPv4 and IPv6 and Node/curl may pick the address the container isn't bound to. The published ports are pinned to `127.0.0.1` in the compose file for this reason.
- **Iterating on specs:** keep one verified stack up and run `E2E_NO_WEBSERVER=1 npm test` so Playwright doesn't try to manage docker each run.

## Coverage map

| Module | Public (Hubble) | Public (Meteor) | Admin CRUD | Mobile |
|--------|-----------------|-----------------|------------|--------|
| Shell / nav / static pages | ✅ | ✅ | n/a | ✅ |
| Canonical host (alias domains 301, legacy permalinks stay https) | ✅ | ✅ | n/a | n/a |
| SEO meta (title/OG/canonical/404 noindex) | 🟡 | ⬜ | n/a | n/a |
| Plaza kiosk screen (`/plaza-page`) | 🟡 | n/a | n/a | n/a |
| Menu | ✅ | ✅ | ✅ | ✅ |
| Menu visibility toggles (hide item / section / tab) | ✅ | n/a | ✅ | ⬜ |
| Daily dinner dish | ✅ | n/a | ✅ | ✅ |
| Opening hours (+ CMS footer) | ✅ | ✅ | ✅ | ✅ |
| Status banner (Meteor) | n/a | ✅ | n/a | ✅ |
| Events | ✅ | ✅ | ✅ | ✅ |
| Board (current / previous / supervisory) | ✅ | ✅ | ✅ | ✅ |
| Vacancies | ✅ | n/a | ✅ | ✅ |
| Associations | ✅ | n/a | ✅ | ✅ |
| Media library (upload, size limit) | n/a | n/a | 🟡 | ⬜ |
| Roles / read-only viewer / DDD poster | n/a | n/a | ✅ | ✅ |
| Identity refresh under concurrency (regression) | n/a | n/a | ✅ | n/a |
| Aurora screen scenes (open / last call / closed) | n/a | n/a | ✅ | ⬜ |
| Admin dashboard (quick-nav + live widgets) | n/a | n/a | 🟡 | n/a |
| Forms: Meteor complaints | n/a | ✅ | n/a | ✅ |
| Forms: Meteor declarations | n/a | ✅ | n/a | ✅ |
| Forms: Hubble screens / declarations | ✅ | n/a | n/a | ⬜ |
| Forms: Hubble tips / information / loan | ✅ | n/a | n/a | ✅ |

Legend: ⬜ not yet · 🟡 specs landed · ✅ green against the stack. Cells move to ✅ once the suite has been run against `docker-compose.e2e.yml`. Update this table as specs land.

Form specs assert both the staff notification (to the per-form team list, with any upload attached) and the submitter confirmation (to the submitter, from the site noreply address, no attachment) via Mailpit. The five Hubble forms live under `/contact/*` (screens, declarations, tips, information, loan-equipment); Meteor has the complaints form at `/complaints` and the declaration form at `/declarations`. The two cafes are separate companies, so the declaration specs also assert that a declaration never reaches the other cafe's treasurer. ALTCHA runs disabled in e2e, so the widget never has to solve a real challenge; the attribute is guarded by a component test in each public app instead.

## Next specs

The backfill is essentially complete: every shipped module is green on its sites, in admin CRUD, and
on mobile (via the `mobile-admin` project for admin-on-a-phone). The remaining `⬜`s are the Hubble
file-upload forms (screens/declarations) on mobile, the desktop specs already cover the upload path,
so this is a low-priority responsive-layout check, and the media library on mobile. The media spec
checks that an oversize image is refused client-side with a readable message rather than reaching the
backend and coming back as a bare 413; the limit itself is `spring.servlet.multipart.max-file-size`,
mirrored in `admin/src/lib/upload.ts`. The rate-limit filter is disabled under the `e2e`
profile (its per-IP counter would otherwise leak across form specs) and is covered directly by
`RateLimitFilterTest` in the backend.
