# public-hubble

Vite + React SPA for **hubble.cafe**, Hubble's own design and identity: a white header with the duck logo, a dark-teal canvas with white "floating" content cards, AXIS titles + Lato body. Renders the shared CMS content (menu, daily dish, opening hours, events, board, vacancies, associations) plus Hubble's hardcoded page copy and the on-site forms. Consumes `@cafe/shared-web`.

## Status

Complete. Sticky header with the primary navigation (desktop dropdowns + mobile menu), home with live opening hours, and every page: menu, daily dish, events, board (current / previous / supervisory), vacancies, associations, the café / discount-policy / committees pages, the five contact forms (tips, information, declarations, screens, loan equipment) protected by honeypot + rate-limit + self-hosted ALTCHA, and the full-screen plaza kiosk at `/plaza-page`. Per-route SEO/OpenGraph meta, a real 404, robots/sitemap, and 301 redirects from the old WordPress permalinks are in place; the site is cookieless with self-hosted fonts and assets. Reservations and the food tracker link out (`harry.hubble.cafe`, `food.hubble.cafe`). Sentry wired.

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
