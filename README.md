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

React 19 + TypeScript + Vite + Tailwind (frontends), Spring Boot + Java 21 + JPA (backend), MariaDB, Azure AD / Entra auth, Sentry, Docker / Portainer. Cookieless, no third-party tracking.

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

### Single app (hot reload)

```bash
npm run dev --workspace @cafe/public-hubble
npm run dev --workspace @cafe/public-meteor
npm run dev --workspace @cafe/admin     # needs VITE_AZURE_* in .env for Microsoft login
cd backend && ./mvnw spring-boot:run
```

See [`e2e/README.md`](e2e/README.md) for the end-to-end test suite and coverage map.

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

Feature-complete and running at `test.hubble.cafe` and `test.meteor.cafe`: all CMS modules, the on-site forms, the static pages, the admin, and the full e2e suite are in place. Remaining before the apex DNS cutover is the production configuration (point the stack at the live domains) and a final content-parity check against the current sites.

## Contributing

Conventional Commits, branch off `main`, every PR requires owner approval (see [`.github/pull_request_template.md`](.github/pull_request_template.md)).
