-- 2026-09-04: let audit_log accept new action and entity types without a schema change.
--
-- Hibernate renders @Enumerated(STRING) as a native MariaDB ENUM on this dialect, so the
-- deployed audit_log.action lists exactly the values that existed when the table was created.
-- Adding REORDER to the AuditAction enum therefore made every reorder fail in production with
-- "Data truncated for column 'action'" (MariaDB 1265), because prod runs ddl-auto=validate and
-- never widens the column. Local stacks run ddl-auto=update, which quietly rebuilt the enum,
-- which is why this did not show up before deploying.
--
-- Converting to VARCHAR rather than adding one more value to the ENUM: it matches what
-- docs/schema.sql has always documented, and it means no future audit action or entity type
-- needs a migration at all. Verified that ddl-auto=validate starts cleanly against VARCHAR
-- columns for these enum-mapped fields, so the running app accepts the change.
--
-- Run this ONCE against production (and any long-lived database) BEFORE deploying the new
-- backend image. It is safe to run against a database whose columns are already VARCHAR.

ALTER TABLE audit_log
  MODIFY COLUMN action VARCHAR(30) NOT NULL;

ALTER TABLE audit_log
  MODIFY COLUMN entity_type VARCHAR(40) NOT NULL;
