# backend

Spring Boot + Java 21 + JPA API on MariaDB. Serves the 5 CMS modules to the public sites and
admin, with content scoped by `BarLocation { HUBBLE, METEOR }` (nullable = shared). Reuses the
Harry List patterns: Azure AD resource-server auth, audit log, email-template + SMTP (forms),
Sentry.

_Scaffolded in a later step._
