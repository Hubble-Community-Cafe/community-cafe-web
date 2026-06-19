# e2e, Playwright full-stack tests

Browser tests across both public sites + the admin, **desktop and mobile**, against a real
backend + MariaDB. Mirrors the Harry List e2e harness: e2e-only `/test` reset + user seeding,
content seeded through the real admin API via the `X-Test-Oid` header bridge, and evidence
capture (screenshots/JSON attached to the HTML report).

## Running

```bash
npm install                 # once
npx playwright install chromium  # once: the browser Playwright drives
npm run stack:up            # build + start the e2e docker stack (or let `npm test` boot it)
npm test                    # run all projects (boots the stack if not already up)
npm run stack:down          # tear down + wipe the e2e database
```

The stack is `docker-compose.e2e.yml`: MariaDB + backend (`e2e` Spring profile, header-auth
bridge) + both public sites + the admin, on ports 6173 (Hubble), 6174 (admin), 6175 (Meteor),
8080 (backend). Set `E2E_NO_WEBSERVER=1` to run specs against an already-running stack.

Projects (see `playwright.config.ts`): `public-hubble`, `public-meteor`, `admin` (Desktop Chrome),
and `mobile-hubble`, `mobile-meteor` (Pixel 5). Page objects live in `pages/`, fixtures in
`fixtures/` (`backend.ts` = reset/seed helpers, `evidence.ts` = report attachments).

## Coverage map

| Module | Public (Hubble) | Public (Meteor) | Admin CRUD | Mobile |
|--------|-----------------|-----------------|------------|--------|
| Shell / nav / static pages | 🟡 | 🟡 | n/a | 🟡 |
| Menu | 🟡 | 🟡 | ⬜ | 🟡 |
| Daily dinner dish | 🟡 | n/a | 🟡 | ⬜ |
| Opening hours (+ CMS footer) | 🟡 | ⬜ | ⬜ | 🟡 |
| Status banner (Meteor) | n/a | 🟡 | n/a | ⬜ |
| Events | 🟡 | 🟡 | ⬜ | ⬜ |
| Board (current / previous / supervisory) | 🟡 | 🟡 | ⬜ | ⬜ |
| Vacancies | 🟡 | n/a | ⬜ | ⬜ |
| Associations | 🟡 | n/a | 🟡 | 🟡 |
| Roles / read-only viewer / DDD poster | n/a | n/a | 🟡 | ⬜ |
| Forms (contact / tips / …) | ⬜ | ⬜ | n/a | ⬜ |

Legend: ⬜ not yet · 🟡 specs landed · ✅ green against the stack. Cells move to ✅ once the
suite has been run against `docker-compose.e2e.yml`. Update this table as specs land.

## Next specs

Admin CRUD round-trips for the remaining modules (menu, events, board, hours, daily dish via the
UI); opening-hours admin editing; more mobile coverage; and the Forms module once Step 7 lands.
