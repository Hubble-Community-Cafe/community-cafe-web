# backend

Spring Boot 4 + Java 21 + JPA API on MariaDB. Serves the 5 CMS modules to the public sites and admin, with content scoped by `BarLocation { HUBBLE, METEOR }` (nullable = shared). Reuses the Harry List patterns: Microsoft Entra resource-server auth, audit log, Sentry. Email-template + Graph mail (forms) arrive with the Forms milestone.

## Status (skeleton)

- **Auth.** OAuth2 resource server validating Entra JWTs (`SecurityConfig`, `!e2e`); a header-auth bridge for end-to-end tests (`E2eSecurityConfig`, `e2e` profile). `/api/public/**` reads are open; `/api/admin/**` requires a token. `RoleAuthorizationFilter` auto-provisions the user on first login  and adds hierarchical roles (VIEWER < EDITOR < ADMIN); `app.initial-admin-oid` bootstraps the first admin.
- **Audit log.** `AuditService` records who/what/when with field-level diffs; never breaks the underlying operation. Read via `GET /api/admin/audit` (admin).
- **Media.** `MediaAsset` entity + repository + read endpoint (byte upload lands with the first image-bearing module).
- **Ops.** Sentry wired (blank DSN disables it), actuator health, OpenAPI/Swagger UI, CORS, global exception handling. Multi-stage `Dockerfile` (non-root, health check).
- **Endpoints.** `GET /` info, `GET /actuator/health`, `GET /api/admin/users/me`,`GET /api/admin/users` + `PATCH /api/admin/users/{id}/role` (admin), `GET /api/admin/audit`,`GET /api/admin/media`.

## Build & test

```bash
cd backend
./mvnw test                       # 13 tests (audit, RBAC, security wiring)
./mvnw -q -DskipTests package     # boot jar in target/
```

Config is environment-driven (see `.env.example`): `SPRING_DATASOURCE_*`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `INITIAL_ADMIN_OID`, `CORS_ALLOWED_ORIGINS`, `SENTRY_DSN`. Profiles: default (dev), `prod` (validate schema, Swagger off), `e2e` (header-auth bridge), `test` (in-memory H2).
