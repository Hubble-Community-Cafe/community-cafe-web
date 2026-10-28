-- The hierarchical roles VIEWER, DDD_POSTER and EDITOR are gone: what a non-admin may do is now
-- stored per tab in admin_user_permission, which V4 already filled with exactly the access each
-- of these roles gave. Only the admin switch stays in the role column.

UPDATE `admin_user` SET `role` = 'STAFF' WHERE `role` IN ('VIEWER', 'DDD_POSTER', 'EDITOR');
