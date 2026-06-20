# public-hubble

Vite + React SPA for **hubble.cafe**, Hubble's own design and identity: a white header with the duck logo, a dark-teal canvas with white "floating" content cards, AXIS titles + Lato body. Renders the shared CMS content (menu, opening hours, events, board, vacancies) plus Hubble's  hardcoded page copy. Consumes `@cafe/shared-web`.

## Status

Base shell in place: sticky header with the full primary navigation (desktop dropdowns + mobile menu), home hero with the live CTAs, footer with Hubble's contact details, client-side routing with placeholder pages for every nav target, and Sentry wiring. Reservations and the food tracker link out (`harry.hubble.cafe`, `food.hubble.cafe`). CMS-driven modules fill in over later milestones.

## Develop

```bash
npm install                                   # from the repo root (workspaces)
npm run dev --workspace @cafe/public-hubble   # http://localhost:5173
```

Set `VITE_PUBLIC_API_URL` (and optionally `VITE_PUBLIC_HUBBLE_SENTRY_DSN`) in a local `.env`, or inject `API_URL` / `SENTRY_DSN` at runtime via `config.js` in the container.

## Verify

```bash
npm run test:run --workspace @cafe/public-hubble
npm run build --workspace @cafe/public-hubble
npm run lint --workspace @cafe/public-hubble
```

## Docker

Build context is the repo root (workspaces), so shared-web is available:

```bash
docker build -f public-hubble/Dockerfile -t public-hubble .
```
