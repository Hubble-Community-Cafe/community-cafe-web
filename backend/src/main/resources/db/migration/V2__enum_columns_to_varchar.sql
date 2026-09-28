-- Store every Java enum as VARCHAR instead of a native MariaDB ENUM.
--
-- A native ENUM lists its allowed values in the column definition, so each new Java enum constant
-- needed an ALTER TABLE, and forgetting one only failed at runtime ("Data truncated for column") on
-- the first insert with the new value (see the audit_log incident of 2026-09-04).
-- hibernate.type.prefer_native_enum_types=false keeps Hibernate on VARCHAR from now on. Existing
-- values are kept as they are; only the column type changes. Lengths and nullability follow the
-- entities (@Column).
--
-- audit_log was converted by hand on production (2026-09-04), so there the two statements for it
-- below change nothing. Local databases built by ddl-auto=update still have ENUMs there; this
-- brings every database to the same schema.

ALTER TABLE `admin_user`
  MODIFY `role` varchar(20) NOT NULL;

ALTER TABLE `association`
  MODIFY `bar` varchar(20) DEFAULT NULL;

ALTER TABLE `audit_log`
  MODIFY `action` varchar(30) NOT NULL,
  MODIFY `entity_type` varchar(40) NOT NULL;

ALTER TABLE `board_term`
  MODIFY `bar` varchar(20) DEFAULT NULL,
  MODIFY `type` varchar(20) NOT NULL;

ALTER TABLE `event`
  MODIFY `bar` varchar(20) NOT NULL;

ALTER TABLE `form_submission`
  MODIFY `type` varchar(20) NOT NULL;

ALTER TABLE `hours_override`
  MODIFY `bar` varchar(20) NOT NULL;

ALTER TABLE `media_asset`
  MODIFY `bar` varchar(20) DEFAULT NULL;

ALTER TABLE `menu_category`
  MODIFY `bar` varchar(20) DEFAULT NULL,
  MODIFY `kind` varchar(10) NOT NULL;

ALTER TABLE `opening_hours`
  MODIFY `bar` varchar(20) NOT NULL,
  MODIFY `day_of_week` varchar(10) NOT NULL;

ALTER TABLE `vacancy`
  MODIFY `bar` varchar(20) DEFAULT NULL;
