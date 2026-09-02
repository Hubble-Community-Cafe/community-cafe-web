# public-meteor

Vite + React SPA for **meteor.cafe**, Meteor's own design and identity, distinct from Hubble: a warm, light look on Meteor's deep green with a gold accent (AXIS titles + Lato body). Includes the open/closed status banner. Renders the shared CMS content plus Meteor's hardcoded page copy. Consumes `@cafe/shared-web`.

## Status

Complete. The open/closed status banner driven by live `BarStatus`, sticky header with Meteor's navigation (desktop dropdowns + mobile menu), home with live opening hours, and every page: menu, agenda (events), board (current / previous), the discount-policy page, and the complaints/tips and online-declaration forms (honeypot + rate-limit + self-hosted ALTCHA). Per-route SEO/OpenGraph meta, a real 404, robots/sitemap, and 301 redirects from the old WordPress permalinks are in place; cookieless with self-hosted fonts and assets. Reservations and the food tracker link out (`harry.hubble.cafe`, `food.meteor.cafe`). Sentry wired.

## Develop

```bash
npm install                                   # from the repo root (workspaces)
npm run dev --workspace @cafe/public-meteor   # http://localhost:5173
```

Set `VITE_PUBLIC_API_URL` (and optionally `VITE_PUBLIC_METEOR_SENTRY_DSN`) in a local `.env`, or inject `API_URL` / `SENTRY_DSN` at runtime via `config.js` in the container.

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
