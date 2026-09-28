# Community Café Web

Self-maintained rebuild of **[hubble.cafe](https://hubble.cafe)** and **[meteor.cafe](https://meteor.cafe)**: two distinct public websites that share a single staff/board CMS, replacing the legacy WordPress sites. Content (menu, opening hours, events, board, vacancies) is entered **once** in the admin and published to the right site(s), so it no longer has to be maintained in two places.

> Reservations (`harry.hubble.cafe`) and the food trackers (`food.*.cafe`) are **not** part of
> this project. The sites link out to those existing apps.

## Repository layout

| Path | What it is |
|------|------------|
| `public-hubble/` | Vite + React SPA, Hubble's own design and identity |
| `public-meteor/` | Vite + React SPA, Meteor's own design and identity |
| `shared-web/`    | Shared API client, TS types, theme tokens, build config (no page layouts) |
| `admin/`         | React admin (Azure AD) for staff/board to manage both bars |
| `backend/`       | Spring Boot + JPA + MariaDB; content scoped by `BarLocation` (Hubble/Meteor) |
| `e2e/`           | Playwright tests (desktop + mobile), page objects, coverage map |

## What staff/board can edit (the CMS modules)

Menu (incl. TU/e dual pricing), daily dinner dish, opening hours (plus the Meteor closed-banner), events (both bars), board (current shared, previous per-bar, supervisory), vacancies, and associations. All other page copy (forms, static pages, the plaza screen) is part of each site's code.

### Screens (Aurora)

The admin also has a **Screens** panel that switches every Aurora narrowcasting screen between three scenes: **Open** (the poster carousel), **Last call** and **Closed** (a static slide). Any signed-in staff member can switch the scene, since that is a bar-shift action; editors additionally choose which Aurora poster each scene shows.

Aurora is called server to server from the backend, never from the browser: Aurora's CORS hardcodes `allowedHeaders: ['Cookie', 'Cookies']` and sets no `Allow-Credentials`, so a browser preflight carrying `content-type` or `x-api-key` is refused no matter what its `CORS_ORIGINS` says. Configure with `AURORA_ENABLED`, `AURORA_BASE_URL`, `AURORA_POSTER_BASE_URL` (the Aurora *client* host, which serves the poster images) and `AURORA_API_KEY`. The key belongs to an Aurora integration user scoped to `getScreenHandlers`, `setScreenHandler` and `showStaticPoster`. Left unset, the panel shows a "not configured" state rather than failing.

Note that [star-wind](https://github.com/Hubble-Community-Cafe/star-wind) drives the same screens from Starcommunity webhooks. Both write the same state and neither knows about the other, so the panel always reads the live state back from Aurora and reports `Mixed` when the screens disagree.

## Tech stack

React 19 + TypeScript + Vite + Tailwind (frontends), Spring Boot + Java 25 + JPA (backend), MariaDB, Azure AD / Entra auth, Sentry, Docker / Portainer. Cookieless, no third-party tracking.

## Getting started

The frontends are one npm **workspace**, so install once at the repo root.

```bash
npm install
```

### Full local stack (MariaDB + backend + both sites + admin)

```bash
cp .env.example .env   # fill in Entra ids for admin login (see below)
docker compose up --build
```

| App | URL |
|-----|-----|
| Admin | http://localhost:5173 |
| Hubble | http://localhost:5174 |
| Meteor | http://localhost:5175 |
| Backend (Swagger) | http://localhost:8080/swagger-ui.html |

Real Microsoft (Entra) login works locally once `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `INITIAL_ADMIN_OID`, and `VITE_ALLOWED_GROUP_ID` are set in `.env`. The admin is served on `http://localhost:5173`, which is registered as an Entra redirect URI; your first sign-in is provisioned as ADMIN (via `INITIAL_ADMIN_OID`). For Portainer/test deployment, copy [`docker-compose.portainer.template.yml`](docker-compose.portainer.template.yml) and fill it in.

> **`INITIAL_ADMIN_OID` only applies when your user row is first created.** If you have already
> signed in once and were provisioned as VIEWER, setting it afterwards changes nothing. Promote
> the account directly instead, which `npm run dev:doctor` prints the exact command for.

**Staff group in the backend.** `ALLOWED_GROUP_ID` on the admin container only hides the admin UI from people outside the staff group. Set the same group id as `ALLOWED_GROUP_ID` on the backend to also refuse their API calls: tokens without the group get a 403 and no user row is created for them. The backend reads the group from the `groups` claim of the access token, so first enable it in the app registration (Token configuration > Add groups claim > "Security groups", ticked for the Access token), then set the variable, or every staff member is refused. Entra leaves the claim out for users in more than 200 groups; the backend then refuses them too. Where the Entra plan allows it, also set "Assignment required?" to Yes on the enterprise application and assign only the staff group. The local dev stack leaves the backend check off.

### Checking the local stack

Three commands, all aimed at the dev stack above (not the Playwright stack in `e2e/`):

```bash
npm run dev:doctor   # what is broken and the exact command to fix it
npm run dev:seed     # load demo content so there is something to edit
npm run dev:smoke    # assert the running stack actually works
```

`dev:doctor` checks that every container is up rather than crash-looping, that the database is healthy **and attached to the compose network** (detached, it stays healthy while the backend fails with `UnknownHostException: db`, which is otherwise only visible deep in the backend log), that each service answers, that content is seeded, and that some account can edit. Every failure prints its own fix.

`dev:seed` loads [`docs/seed-menu.sql`](docs/seed-menu.sql), the real menu copied from the live sites, plus [`docs/seed-board-vacancies.sql`](docs/seed-board-vacancies.sql), invented board and vacancy rows for local use. The dev stack authenticates against real Entra, so unlike the e2e fixtures this writes straight to MariaDB. Both files truncate their own tables first, so it is safe to re-run; it leaves `admin_user`, media, audit, and opening hours alone.

`dev:smoke` asserts the services answer, the seeded content reaches the public API, the two bars stay distinct, inactive rows stay off the public site, and the public API honours `sort_order` (it swaps two positions in the database, checks the public menu follows, then restores them). Set `ADMIN_TOKEN` to an Entra bearer token to also exercise the admin write path, including that a reorder persists and that an incomplete one is rejected; without it that section is skipped, since the reorder service logic is covered by the backend tests and the admin UI by the Playwright suite.

### Single app (hot reload)

```bash
npm run dev --workspace @cafe/public-hubble
npm run dev --workspace @cafe/public-meteor
npm run dev --workspace @cafe/admin     # needs VITE_AZURE_* in .env for Microsoft login
cd backend && ./mvnw spring-boot:run
```

See [`e2e/README.md`](e2e/README.md) for the end-to-end test suite and coverage map.

CI measures unit-test coverage (JaCoCo for the backend, `npm run test:coverage` per frontend) and shows the line, branch and function totals on each run's summary page, with the full HTML reports as artifacts. It is report-only for now: no minimum fails the build. Run the same locally with `./mvnw test` (report in `backend/target/site/jacoco/`) or `npm run test:coverage --workspace @cafe/<app>` (report in `<app>/coverage/`).

## Database schema (Flyway)

The schema is managed by Flyway. Migrations live in [`backend/src/main/resources/db/migration`](backend/src/main/resources/db/migration) and run automatically when the backend starts, in every environment; there are no manual migration steps. Hibernate only validates the entities against the result (`ddl-auto=validate`, also in the compose files and the Portainer template). Never switch to `update`: it hides a missing migration until production.

- **Changing the schema:** add `V<next number>__short_description.sql` (for example `V3__add_event_location.sql`) next to the entity change. Never edit a migration that has already run; fix it with a new one. An entity change without its migration fails at startup, locally and in e2e, before it can reach production.
- `V1__baseline.sql` is the production schema from before Flyway. Production was marked as V1 without running it; it only builds new databases (e2e, local development).
- Enums are stored as `VARCHAR` (`hibernate.type.prefer_native_enum_types=false`), so a new enum value needs no migration.
- The database user needs `CREATE`, `ALTER`, `INDEX` and `REFERENCES` rights on the database, because the backend applies the migrations itself. Take a MariaDB backup before deploying a version that contains new migrations.
- **A local database from before Flyway** (built by the old `ddl-auto=update`) is upgraded automatically, but may still carry old columns the entities no longer have. Recreate it once with `docker compose down -v` (this deletes your local data and uploads) and `npm run dev:seed`.

## Data retention

The backend removes personal data it no longer needs, every night at 03:30 (`DataRetentionService`):

| Data | Rule | Setting (days, `0` switches the rule off) |
| --- | --- | --- |
| Audit log: who made a change (name, email, Entra ID) | blanked after 1 year; the change itself stays | `DATA_RETENTION_AUDIT_ANONYMISE_DAYS` (365) |
| Audit log entries | deleted after 2 years | `DATA_RETENTION_AUDIT_DELETE_DAYS` (730) |
| Form submission records (form type, date, attachment flag; no personal data) | deleted after 2 years | `DATA_RETENTION_FORM_SUBMISSION_DAYS` (730) |
| Staff/board accounts without a sign-in | deleted after 1 year, **never ADMIN accounts** | `DATA_RETENTION_INACTIVE_ADMIN_USER_DAYS` (365) |

A removed account that signs in again (still gated by the staff group) comes back as VIEWER, so an admin has to give the role back. The last sign-in is tracked from the release that added this; existing accounts start counting from that deploy. Each run logs one line such as `event=data_retention audit_anonymised=2 audit_deleted=1 form_submissions_deleted=0 admin_users_deleted=1`, with counts only. The schedule is `DATA_RETENTION_CRON` (Spring cron, default `0 30 3 * * *`); it is off in the e2e stack.

## Content-Security-Policy

All three frontends send an enforcing Content-Security-Policy, so the browser blocks any script, image, style or request from an origin that is not listed. The public sites set it in their `nginx.conf`; the admin keeps it in [`admin/nginx-csp.conf`](admin/nginx-csp.conf), rendered at container startup with the origin of `API_URL` filled in. When a feature needs another origin (an external API, image host or embed), add it to the right policy or the browser will block it. The admin allows `https://aurora-client.hubble.cafe` for Screens poster thumbnails, so a different `AURORA_POSTER_BASE_URL` on the backend also needs that entry changed. To try an admin policy change without blocking anything, set `CSP_REPORT_ONLY=true` on the admin container: violations are then only logged in the browser console. The e2e spec `admin/csp` fails on any violation.

## Domains and certificates

Each site has one **canonical host**, `hubble.cafe` and `meteor.cafe`. Everything else is an alias that resolves to the same container:

| Site | Canonical | Aliases |
| --- | --- | --- |
| Hubble | `hubble.cafe` | `hubblecafe.nl`, `hubblecommunity.cafe`, `hubbel.cafe`, `ducksandbears.cafe`, `ducksandbears.nl`, `ducksandbearscafe.nl`, `barpotential.nl`, `tappersgil.de`, `wijbeunenvoorbier.nl` |
| Meteor | `meteor.cafe` | `meteorcommunity.cafe`, `meteorcommunity.nl`, `meteorcommunitycafe.nl` |

Aliases **301 to the canonical host** (the `map $host $canonical_redirect` block in each site's `nginx.conf`). This is not cosmetic: the backend allowlists the canonical origins only, so a visitor served on an alias got a site whose menu, opening hours and status banner all failed with a CORS 403 while looking perfectly healthy. Keep `CORS_ALLOWED_ORIGINS` limited to the canonical origins and let the redirect do the work.

When a domain is added, point its DNS at the same host, add it to the vhost certificate, and it is redirected automatically (the map redirects every host it does not recognise). Only `localhost`, `127.0.0.1` and the `test.*` hosts are exempt, for local dev, the container health check and the Playwright stack.

## When a page cannot load its content

A visitor whose content fetch fails only sees "could not load", so the public sites report the
failure to Sentry themselves (`reportApiFailure` in `shared-web/src/api/errorReporting.ts`).
Before reporting, they probe `GET /` on the backend, which returns its uptime, and use the
result to tell an expected blip from a real problem:

| Probe result | Meaning | Reported as |
| --- | --- | --- |
| Backend up, uptime above 3 minutes | The backend is fine, so the failure is client-side: a blocking extension, a DNS filter, a proxy, a rejected origin | `error` |
| Backend just restarted, or its proxy answers 5xx | A deploy or restart window | not reported, breadcrumb only |
| Readable probe fails, opaque one succeeds | The request arrives and CORS refuses the read, so an origin is missing from `CORS_ALLOWED_ORIGINS` | `error` |
| Neither probe gets through | Unreachable: network, blocker, or a deploy still in progress | `warning` |

Failures while the visitor is offline or the tab is hidden are never reported: browsers cancel
in-flight requests in both cases, so those events say nothing. Events carry no personal data,
only the feature, the failure kind, the HTTP status and the coarse connection type.

Triage in Sentry by the `api.backend` tag: `up` and `cors_rejected` are actionable, `unreachable`
is usually the visitor's network.

## Status

Feature-complete and running at `hubble.cafe` and `meteor.cafe`: all CMS modules, the on-site forms, the static pages, the admin, and the full e2e suite are in place.

## Security checks

[`.github/workflows/security.yml`](.github/workflows/security.yml) runs on every PR into `main` and `develop`, every push to `main`, weekly on Monday (so a new CVE in an unchanged dependency still surfaces) and on demand: gitleaks (secrets in the git history), Semgrep (static analysis), `npm audit` (the frontend workspace and `e2e`), OWASP Dependency-Check (backend Maven dependencies) and Trivy (lockfiles, Dockerfiles and compose files; the backend is left to OWASP via [`.github/trivy.yaml`](.github/trivy.yaml)). Only critical findings fail the check: a leaked secret, OWASP CVSS 9 or higher, a critical npm advisory, or a critical Trivy finding with a fix available. Everything else is reported in the repository's Security tab (code scanning). The OWASP job only runs weekly and when started by hand (Actions > Security > Run workflow, on `main`), because its first run downloads the whole NVD database (about an hour); later runs reuse the cache and take minutes. It needs an `NVD_API_KEY` repository secret ([request a key](https://nvd.nist.gov/developers/request-an-api-key)); without it the job is skipped with a warning. Confirmed false positives go in [`backend/.owasp-suppressions.xml`](backend/.owasp-suppressions.xml) with a reason, never in `continue-on-error`.

## Contributing

Conventional Commits, branch off `main`, every PR requires owner approval (see [`.github/pull_request_template.md`](.github/pull_request_template.md)).
