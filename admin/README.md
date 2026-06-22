# admin

React admin app (Microsoft Entra / Azure AD login) where staff and board manage **both** cafes from one place. Consumes `@cafe/shared-web`. Intentionally neutral styling (it is not branded as Hubble or Meteor). Manages the CMS modules (menu, daily dish, opening hours, events, board, vacancies, associations) plus media; shared content (current board) is edited once, per-bar content is scoped by bar.

## Status

- **Auth.** MSAL login against the project's Entra app (`authConfig`), Microsoft sign-in page, and a protected app gated by Entra **group membership** (`useGroupAuthorization`, `ALLOWED_GROUP_ID`). An e2e bridge (`e2eAuth`) swaps MSAL for `X-Test-*` headers in the test stack.
- **Roles.** `RoleProvider` loads the signed-in user from `GET /api/admin/users/me`; `usePermissions` derives capabilities (VIEWER < DDD_POSTER < EDITOR < ADMIN). The sidebar and routes are role-gated: viewers read, DDD posters also edit the daily dish, editors edit all content, admins also see Users and the Audit log.
- **Pages.** Login, a Dashboard with quick-nav tiles and live status widgets (today's dish, upcoming events, special hours, recent activity), full CRUD for every content module plus the media library, Users (list + change role), and the paged Audit log.
- **Ops.** Sentry via runtime config, error boundary, `noindex` headers, workspace-aware Dockerfile + nginx with runtime config injection (`API_URL`, `AZURE_*`, `REDIRECT_URI`, `ALLOWED_GROUP_ID`, `SENTRY_DSN`).

## Develop

```bash
npm install                            # from the repo root (workspaces)
npm run dev --workspace @cafe/admin    # http://localhost:5173
```

Set `VITE_API_URL`, `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, `VITE_ALLOWED_GROUP_ID` in a local `.env`, or inject them at runtime via `config.js` in the container.

## Verify

```bash
npm run test:run --workspace @cafe/admin
npm run build --workspace @cafe/admin
npm run lint --workspace @cafe/admin
```
