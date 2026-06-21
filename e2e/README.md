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
| Menu | ✅ | ✅ | ✅ | ✅ |
| Daily dinner dish | ✅ | n/a | ✅ | 🟡 |
| Opening hours (+ CMS footer) | ✅ | 🟡 | ✅ | ✅ |
| Status banner (Meteor) | n/a | ✅ | n/a | 🟡 |
| Events | ✅ | ✅ | ✅ | 🟡 |
| Board (current / previous / supervisory) | ✅ | ✅ | ✅ | 🟡 |
| Vacancies | ✅ | n/a | ✅ | 🟡 |
| Associations | ✅ | n/a | ✅ | ✅ |
| Roles / read-only viewer / DDD poster | n/a | n/a | ✅ | 🟡 |
| Forms: Meteor complaints | n/a | ✅ | n/a | 🟡 |
| Forms: Hubble screens / declarations | ✅ | n/a | n/a | ⬜ |
| Forms: Hubble tips / information / loan | ✅ | n/a | n/a | 🟡 |

Legend: ⬜ not yet · 🟡 specs landed · ✅ green against the stack. Cells move to ✅ once the suite has been run against `docker-compose.e2e.yml`. Update this table as specs land.

Form specs assert both the staff notification (to the per-form team list, with any upload attached) and the submitter confirmation (to the submitter, from the site noreply address, no attachment) via Mailpit. The five Hubble forms live under `/contact/*` (screens, declarations, tips, information, loan-equipment); Meteor has the complaints form at `/complaints`. ALTCHA runs disabled in e2e, so the widget never has to solve a real challenge; the attribute is guarded by a component test in each public app instead.

## Next specs

Mobile coverage is now broad (daily dish, status banner, vacancies, events, board, RBAC, plus the
Meteor complaints and Hubble tips forms on a phone, via the new `mobile-admin` project). The only
remaining `⬜` is the Hubble file-upload forms (screens/declarations) on mobile. The rate-limit
filter is disabled under the `e2e` profile, so form specs no longer share a per-IP counter; the
filter itself is not exercised end-to-end (worth a focused backend test). Everything tagged 🟡 flips
to ✅ after the next green stack run.
