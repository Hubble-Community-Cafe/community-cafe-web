# backend

Spring Boot 4 + Java 25 + JPA API on MariaDB. Serves the CMS modules to the public sites and admin, with content scoped by `BarLocation { HUBBLE, METEOR }` (nullable = shared). Reuses the Harry List patterns: Microsoft Entra resource-server auth, audit log, Sentry. Public form submissions email staff via Microsoft Graph (Mailpit in dev/e2e), protected by a honeypot, a per-IP rate limit, and self-hosted ALTCHA proof-of-work.

## Status

- **Content.** Menu (+ TU/e dual pricing and daily dish), opening hours (+ overrides and a derived `BarStatus`), events, board (executive/supervisory terms + members), vacancies, and associations, each with public read endpoints and admin CRUD.
- **Forms.** `FormSubmission` records and per-form notifications for the Hubble (tips, information, declarations, screens, loan) and Meteor (complaints, declarations) forms, sent from the per-site noreply address with a submitter confirmation. Declarations carry a `bar` and route to that cafe's own treasurer, since Hubble and Meteor are separate companies; an absent `bar` means Hubble. Mail provider is pluggable (`log` / `smtp` / `graph`).
- **Auth.** OAuth2 resource server validating Entra JWTs (`SecurityConfig`, `!e2e`); a header-auth bridge for end-to-end tests (`E2eSecurityConfig`, `e2e` profile). `/api/public/**` reads are open; `/api/admin/**` requires a token. `RoleAuthorizationFilter` auto-provisions the user on first login and adds hierarchical roles (VIEWER < DDD_POSTER < EDITOR < ADMIN); `app.initial-admin-oid` bootstraps the first admin.
- **Audit log.** `AuditService` records who/what/when with field-level diffs; never breaks the underlying operation. Read via `GET /api/admin/audit` (admin).
- **Media.** `MediaAsset` entity + repository + upload/serve endpoints for event/board/menu/vacancy/association images. Uploads are checked by their real file type (magic bytes, not the browser's claim) and stripped of metadata before they are stored (`media/ImageSanitizer`): EXIF with GPS position, camera and timestamps, XMP, IPTC and comments are removed without re-encoding, while the orientation and colour profile are kept.
- **Data retention.** `DataRetentionService` runs nightly: audit-log actors blanked after a year and entries deleted after two, form submission records deleted after two years, staff accounts not seen for a year deleted (never ADMIN). Periods via `DATA_RETENTION_*`, see the root README.
- **Schema.** Flyway migrations in `src/main/resources/db/migration` run at startup; Hibernate only validates (`ddl-auto=validate`), and enums are stored as `VARCHAR`. See the root README, section Database schema.
- **Ops.** Sentry wired (blank DSN disables it), actuator health, OpenAPI/Swagger UI, CORS, global exception handling. Multi-stage `Dockerfile` (non-root, health check).

## Build & test

```bash
cd backend
./mvnw test                       # full suite (content, forms, RBAC, rate limit, ALTCHA, security)
./mvnw -q -DskipTests package     # boot jar in target/
```

Config is environment-driven (see `.env.example`): `SPRING_DATASOURCE_*`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `INITIAL_ADMIN_OID`, `ALLOWED_GROUP_ID` (optional staff group required in the token's `groups` claim, 403 otherwise), `CORS_ALLOWED_ORIGINS`, `SENTRY_DSN`. Profiles: default (dev), `prod` (Swagger off), `e2e` (header-auth bridge), `test` (in-memory H2, schema from the entities, Flyway off).

## Stripping metadata from images uploaded before this check

Images uploaded before the metadata stripping still carry their original EXIF, which can include the GPS position. To clean the existing files once, run exiftool in a throwaway container against the media volume (the volume is `cafe_media` in the compose file; Portainer prefixes it with the stack name, check `docker volume ls`). It keeps the orientation and colour profile, like the upload check does:

```bash
docker run --rm -v <stack>_cafe_media:/data/media alpine sh -c "apk add --no-cache exiftool && exiftool -r -overwrite_original -all= -tagsFromFile @ -Orientation -ICC_Profile /data/media"
```

The stored sizes in the media library then show the old, slightly larger sizes; that is cosmetic.
