-- 2026-08-10: per-category visibility toggle for the menu.
--
-- Adds the `active` flag to menu_category so a whole tab or sub-heading can be temporarily
-- hidden from the public site (menu_item.active already existed for single items). Hiding is
-- evaluated when the public menu is built and never written down to the rows below, so
-- re-enabling a category restores exactly the items that were visible before.
--
-- Run this ONCE against production (and any long-lived database) BEFORE deploying the new
-- backend image: prod runs with ddl-auto=validate, so the column must exist for the app to
-- start. The column is additive and defaults to 1, so every existing category stays visible
-- and the currently deployed version simply ignores it.

ALTER TABLE menu_category
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
