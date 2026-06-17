# shared-web

Shared low-level building blocks consumed by both public sites and the admin. **Not** page
layouts or page components: the two public sites diverge by design.

Consumed as the workspace package `@cafe/shared-web` (npm workspaces, repo root).

## What's here

- **Theme tokens.** `@cafe/shared-web/theme.css` provides the Tailwind v4 `@theme` block with the
  Hubble (blue) and Meteor (green/gold) palettes plus the AXIS/Lato font stacks. `tokens.ts` mirrors
  the same values as TypeScript constants for use outside Tailwind.
- **Self-hosted fonts.** AXIS (display/title) and Lato (body, weights 300/400/700/900, latin +
  latin-ext) live in `fonts/` and are referenced by `theme.css`. No third-party font CDN, no
  cookies: the bundler fingerprints and emits them per app.
- **API client.** `getApiBaseUrl`, `fetchWithRetry`, and `getJson` resolve the backend URL from
  runtime config (`window.__RUNTIME_CONFIG__`, injected per container) with a build-time env
  fallback, and retry transient failures.
- **Shared types.** TypeScript interfaces for the five CMS modules plus media, mapped to the
  backend data model (`BarLocation`, `MenuItem`, `WeeklyHours`, `CafeEvent`, `BoardTerm`, ...).
- **Base config.** `tsconfig.base.json` and `eslint.config.base.js` that the apps extend.

## Usage

```ts
import { getJson, type CafeEvent, cn } from '@cafe/shared-web'
```

```css
@import "tailwindcss";
@import "@cafe/shared-web/theme.css";
```

## Scripts

```bash
npm run test:run --workspace @cafe/shared-web
npm run lint --workspace @cafe/shared-web
npm run typecheck --workspace @cafe/shared-web
```
