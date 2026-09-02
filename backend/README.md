# backend

Spring Boot 4 + Java 21 + JPA API on MariaDB. Serves the CMS modules to the public sites and admin, with content scoped by `BarLocation { HUBBLE, METEOR }` (nullable = shared). Reuses the Harry List patterns: Microsoft Entra resource-server auth, audit log, Sentry. Public form submissions email staff via Microsoft Graph (Mailpit in dev/e2e), protected by a honeypot, a per-IP rate limit, and self-hosted ALTCHA proof-of-work.

## Status

- **Content.** Menu (+ TU/e dual pricing and daily dish), opening hours (+ overrides and a derived `BarStatus`), events, board (executive/supervisory terms + members), vacancies, and associations, each with public read endpoints and admin CRUD.
- **Forms.** `FormSubmission` records and per-form notifications for the Hubble (tips, information, declarations, screens, loan) and Meteor (complaints, declarations) forms, sent from the per-site noreply address with a submitter confirmation. Declarations carry a `bar` and route to that cafe's own treasurer, since Hubble and Meteor are separate companies; an absent `bar` means Hubble. Mail provider is pluggable (`log` / `smtp` / `graph`).
- **Auth.** OAuth2 resource server validating Entra JWTs (`SecurityConfig`, `!e2e`); a header-auth bridge for end-to-end tests (`E2eSecurityConfig`, `e2e` profile). `/api/public/**` reads are open; `/api/admin/**` requires a token. `RoleAuthorizationFilter` auto-provisions the user on first login and adds hierarchical roles (VIEWER < DDD_POSTER < EDITOR < ADMIN); `app.initial-admin-oid` bootstraps the first admin.
- **Audit log.** `AuditService` records who/what/when with field-level diffs; never breaks the underlying operation. Read via `GET /api/admin/audit` (admin).
- **Media.** `MediaAsset` entity + repository + upload/serve endpoints for event/board/menu/vacancy/association images.
- **Ops.** Sentry wired (blank DSN disables it), actuator health, OpenAPI/Swagger UI, CORS, global exception handling. Multi-stage `Dockerfile` (non-root, health check).

## Build & test

```bash
cd backend
./mvnw test                       # full suite (content, forms, RBAC, rate limit, ALTCHA, security)
./mvnw -q -DskipTests package     # boot jar in target/
```

Config is environment-driven (see `.env.example`): `SPRING_DATASOURCE_*`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `INITIAL_ADMIN_OID`, `CORS_ALLOWED_ORIGINS`, `SENTRY_DSN`. Profiles: default (dev), `prod` (validate schema, Swagger off), `e2e` (header-auth bridge), `test` (in-memory H2).
