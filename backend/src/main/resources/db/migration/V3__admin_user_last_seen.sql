-- When each staff/board account last used the admin, so the data-retention job can remove accounts
-- that have not signed in for a long time (DataRetentionService). Updated at most once a day.
--
-- Existing accounts start counting from this migration: nobody is removed for inactivity until a
-- full retention period after it has run.

ALTER TABLE `admin_user`
  ADD COLUMN `last_seen_at` datetime(6) DEFAULT NULL;

UPDATE `admin_user` SET `last_seen_at` = NOW(6);
