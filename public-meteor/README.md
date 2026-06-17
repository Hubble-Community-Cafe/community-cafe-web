# public-meteor

Vite + React SPA for **meteor.cafe**, Meteor's own design and identity, distinct from Hubble: a
warm, light look on Meteor's deep green with a gold accent (AXIS titles + Lato body). Includes the
open/closed status banner. Renders the shared CMS content plus Meteor's hardcoded page copy.
Consumes `@cafe/shared-web`.

## Status

Base shell in place: the status banner (wired to a placeholder open status until the opening-hours
milestone feeds live `BarStatus`), sticky header with Meteor's navigation (desktop dropdowns +
mobile menu), home hero with the live CTAs, footer with Meteor's contact details, and client-side
routing with placeholder pages. Reservations and the food tracker link out (`harry.hubble.cafe`,
`food.meteor.cafe`). CMS-driven modules fill in over later milestones.

## Develop

```bash
npm install                                   # from the repo root (workspaces)
npm run dev --workspace @cafe/public-meteor   # http://localhost:5173
```

Set `VITE_PUBLIC_API_URL` (and optionally `VITE_PUBLIC_METEOR_SENTRY_DSN`) in a local `.env`, or
inject `API_URL` / `SENTRY_DSN` at runtime via `config.js` in the container.

## Verify

```bash
npm run test:run --workspace @cafe/public-meteor
npm run build --workspace @cafe/public-meteor
npm run lint --workspace @cafe/public-meteor
```

## Docker

Build context is the repo root (workspaces):

```bash
docker build -f public-meteor/Dockerfile -t public-meteor .
```
