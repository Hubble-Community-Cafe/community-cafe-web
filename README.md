# Community Café Web

Self-maintained rebuild of **[hubble.cafe](https://hubble.cafe)** and
**[meteor.cafe](https://meteor.cafe)**: two distinct public websites that share a single
staff/board CMS, replacing the legacy WordPress sites. Content (menu, opening hours, events,
board, vacancies) is entered **once** in the admin and published to the right site(s), so it
no longer has to be maintained in two places.

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

## What staff/board can edit (the 5 CMS modules)

Menu (incl. TU/e dual pricing and daily dish), opening hours (plus closed-banner), events (both
bars), board (current shared, previous per-bar, supervisory), and vacancies. All other page copy
is part of each site's code.

## Tech stack

React 19 + TypeScript + Vite + Tailwind (frontends), Spring Boot + Java 21 + JPA (backend),
MariaDB, Azure AD / Entra auth, Sentry, Docker / Portainer. Cookieless, no third-party tracking.

## Getting started

```bash
# Full dev stack (backend + db + frontends)
docker compose up --build

# Or run a single app
cd backend && ./mvnw spring-boot:run
cd public-hubble && npm ci && npm run dev
cd public-meteor && npm ci && npm run dev
cd admin && npm ci && npm run dev
```

See [`e2e/README.md`](e2e/README.md) for the end-to-end test suite and coverage map.

## Status

Under active rebuild. Both sites run at `test.hubble.cafe` and `test.meteor.cafe` until they
fully match the current sites, then DNS is cut over. Build progresses module by module with a
design-parity and usability check at each step.

## License

_TODO: choose a license (this is a public repository)._

## Contributing

Conventional Commits, branch off `main`, every PR requires owner approval (see
[`.github/pull_request_template.md`](.github/pull_request_template.md)).
